import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';
import { logAuditAction } from '../services/audit.service';

const prisma = new PrismaClient() as any;

// Use strings for Role values since Prisma enum types might lag in IDE
const ROLES = {
    ADMIN: 'ADMIN',
    MEMBER: 'MEMBER',
    VIEWER: 'VIEWER'
};

export const createWorkspace = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Workspace name is required' });

        const slug = slugify(name, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 7);

        const workspace = await prisma.workspace.create({
            data: {
                name,
                slug,
                ownerId: req.userId!,
                members: {
                    create: {
                        userId: req.userId!,
                        role: ROLES.ADMIN
                    }
                }
            },
            include: {
                members: true
            }
        });

        await logAuditAction({
            action: 'WORKSPACE_CREATED',
            resourceType: 'WORKSPACE',
            resourceId: workspace.id,
            userId: req.userId!,
            workspaceId: workspace.id,
            details: { name: workspace.name }
        });

        res.status(201).json(workspace);
    } catch (error) {
        console.error('Create Workspace Error:', error);
        res.status(500).json({ error: 'Failed to create workspace' });
    }
};

export const getMyWorkspaces = async (req: AuthRequest, res: Response) => {
    try {
        const memberships = await prisma.workspaceMember.findMany({
            where: { userId: req.userId! },
            include: {
                workspace: {
                    include: {
                        _count: {
                            select: { members: true, tasks: true }
                        }
                    }
                }
            }
        });

        const workspaces = memberships.map((m: any) => ({
            ...m.workspace,
            myRole: m.role
        }));

        res.json(workspaces);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
};

export const getWorkspaceById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: id,
                    userId: req.userId!
                }
            },
            include: {
                workspace: {
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
            ...membership.workspace,
            myRole: membership.role
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch workspace details' });
    }
};

export const inviteMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id: workspaceId } = req.params;
        const { email, role } = req.body;

        // Admin check is now handled by requireRole middleware


        const userToInvite = await prisma.user.findUnique({ where: { email } });
        if (!userToInvite) return res.status(404).json({ error: 'User not found' });

        const newMember = await prisma.workspaceMember.create({
            data: {
                workspaceId,
                userId: userToInvite.id,
                role: role || ROLES.MEMBER
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
            workspaceId: workspaceId as string,
            details: { invitedUserId: userToInvite.id, role: newMember.role }
        });

        res.status(201).json(newMember);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'User is already a member of this workspace' });
        }
        res.status(500).json({ error: 'Failed to invite member' });
    }
};

export const removeMember = async (req: AuthRequest, res: Response) => {
    try {
        const { id: workspaceId, userId: memberUserId } = req.params;

        // Admin check is now handled by requireRole middleware


        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (workspace?.ownerId === memberUserId) {
            return res.status(400).json({ error: 'Cannot remove the workspace owner' });
        }

        await prisma.workspaceMember.delete({
            where: {
                workspaceId_userId: {
                    workspaceId: workspaceId as string,
                    userId: memberUserId as string
                }
            }
        });

        await logAuditAction({
            action: 'MEMBER_REMOVED',
            resourceType: 'MEMBER',
            resourceId: memberUserId as string,
            userId: req.userId!,
            workspaceId: workspaceId as string,
            details: { removedUserId: memberUserId }
        });

        res.json({ message: 'Member removed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove member' });
    }
};

export const updateMemberRole = async (req: AuthRequest, res: Response) => {
    try {
        const { id: workspaceId, userId: targetUserId } = req.params;
        const { role } = req.body;

        if (!role || ![ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be ADMIN, MEMBER, or VIEWER' });
        }

        // Admin check is now handled by requireRole middleware

        // Prevent demoting the owner
        const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
        if (workspace?.ownerId === targetUserId && role !== ROLES.ADMIN) {
            return res.status(400).json({ error: 'Cannot demote the workspace owner' });
        }

        const updated = await prisma.workspaceMember.update({
            where: {
                workspaceId_userId: {
                    workspaceId: workspaceId as string,
                    userId: targetUserId as string
                }
            },
            data: { role },
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
            workspaceId: workspaceId as string,
            details: { targetUserId: targetUserId, newRole: role }
        });

        res.json(updated);
    } catch (error) {
        console.error('Update Role Error:', error);
        res.status(500).json({ error: 'Failed to update member role' });
    }
};
