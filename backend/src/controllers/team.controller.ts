import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient, Role } from '@prisma/client';
import slugify from 'slugify';
import { logAuditAction } from '../services/audit.service';

const prisma = new PrismaClient();

export const createTeam = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Team name is required' });

        const slug = slugify(name, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 7);

        const team = await prisma.team.create({
            data: {
                name,
                slug,
                ownerId: req.userId!,
                members: {
                    create: {
                        userId: req.userId!,
                        role: Role.ADMIN
                    }
                }
            },
            include: {
                members: true
            }
        });

        await logAuditAction({
            action: 'TEAM_CREATED',
            resourceType: 'TEAM',
            resourceId: team.id,
            userId: req.userId!,
            teamId: team.id,
            details: { name: team.name }
        });

        res.status(201).json(team);
    } catch (error) {
        console.error('Create Team Error:', error);
        res.status(500).json({ error: 'Failed to create team' });
    }
};

export const getMyTeams = async (req: AuthRequest, res: Response) => {
    try {
        const memberships = await prisma.teamMember.findMany({
            where: { userId: req.userId! },
            include: {
                team: {
                    include: {
                        _count: {
                            select: { members: true, tasks: true }
                        }
                    }
                }
            }
        });

        const teams = memberships.map((m: any) => ({
            ...m.team,
            myRole: m.role
        }));

        res.json(teams);
    } catch (error) {
        console.error('Get Teams Error:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
};

export const getTeamById = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const membership = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: id,
                    userId: req.userId!
                }
            },
            include: {
                team: {
                    include: {
                        members: {
                            include: {
                                user: {
                                    select: { id: true, name: true, email: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!membership) return res.status(403).json({ error: 'Access denied' });

        res.json({
            ...membership.team,
            myRole: membership.role
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch team details' });
    }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
    try {
        const teamId = req.params.id as string;
        const { email, role } = req.body;

        const userToInvite = await prisma.user.findUnique({ where: { email } });
        if (!userToInvite) return res.status(404).json({ error: 'User not found' });

        const newMember = await prisma.teamMember.create({
            data: {
                teamId,
                userId: userToInvite.id,
                role: (role as Role) || Role.MEMBER
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        await logAuditAction({
            action: 'MEMBER_INVITED',
            resourceType: 'MEMBER',
            resourceId: newMember.id,
            userId: req.userId!,
            teamId: teamId as string,
            details: { invitedUserId: userToInvite.id, role: newMember.role }
        });

        res.status(201).json(newMember);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'User is already a member of this team' });
        }
        res.status(500).json({ error: 'Failed to invite member' });
    }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
    try {
        const teamId = req.params.id as string;
        const memberUserId = req.params.userId as string;

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (team?.ownerId === memberUserId) {
            return res.status(400).json({ error: 'Cannot remove the team owner' });
        }

        await prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId: teamId as string,
                    userId: memberUserId as string
                }
            }
        });

        await logAuditAction({
            action: 'MEMBER_REMOVED',
            resourceType: 'MEMBER',
            resourceId: memberUserId as string,
            userId: req.userId!,
            teamId: teamId as string,
            details: { removedUserId: memberUserId }
        });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
    try {
        const teamId = req.params.id as string;
        const targetUserId = req.params.userId as string;
        const { role } = req.body;

        if (!role || !Object.values(Role).includes(role as Role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const team = await prisma.team.findUnique({ where: { id: teamId } });
        if (team?.ownerId === targetUserId && role !== Role.ADMIN) {
            return res.status(400).json({ error: 'Cannot demote the team owner' });
        }

        const updated = await prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId: teamId as string,
                    userId: targetUserId as string
                }
            },
            data: { role: role as Role },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        await logAuditAction({
            action: 'MEMBER_ROLE_UPDATED',
            resourceType: 'MEMBER',
            resourceId: updated.id,
            userId: req.userId!,
            teamId: teamId as string,
            details: { targetUserId: targetUserId, newRole: role }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update Role Error:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
};
