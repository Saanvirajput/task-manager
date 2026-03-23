import { Request, Response, NextFunction } from 'express';
import { Role, Visibility } from '@prisma/client';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
    user?: any;
}

export const checkRole = (allowedRoles: Role[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // In our system, the user's role might be context-specific (per Team)
            // or global. Let's check for a team-specific role first if teamId is in params or body.
            const teamId = req.params.teamId || req.body.teamId || req.query.teamId;

            if (teamId) {
                const membership = await prisma.teamMember.findUnique({
                    where: {
                        teamId_userId: {
                            teamId: teamId as string,
                            userId: user.id
                        }
                    }
                });

                if (!membership || !allowedRoles.includes(membership.role)) {
                    return res.status(403).json({ error: 'Insufficient permissions for this team' });
                }
            } else {
                // If no team context, we check if the user is an owner of ANY team with the required role
                // or if they have a global role (though our schema is team-based).
                // For now, if no team context, we might permit but restricted.
                // However, ADMINs can often do global things.

                // Let's assume ADMIN can do anything.
                const isAdminOfAnyTeam = await prisma.teamMember.findFirst({
                    where: { userId: user.id, role: Role.ADMIN }
                });

                if (!isAdminOfAnyTeam && allowedRoles.includes(Role.ADMIN)) {
                    // If strictly looking for ADMIN and not found
                    return res.status(403).json({ error: 'Admin access required' });
                }
            }

            next();
        } catch (error) {
            console.error('RBAC Error:', error);
            res.status(500).json({ error: 'Internal server error during permission check' });
        }
    };
};

export const checkTaskVisibility = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const taskId = req.params.id || req.body.taskId;

        if (!taskId) return next();

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { team: { include: { members: true } } }
        });

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // 1. PUBLIC visibility: Anyone can see
        if (task.visibility === Visibility.PUBLIC) {
            return next();
        }

        // 2. PRIVATE visibility: Only creator or assignee
        if (task.visibility === Visibility.PRIVATE) {
            if (task.createdById === userId || task.assignedToId === userId) {
                return next();
            }
            return res.status(403).json({ error: 'Access denied to private task' });
        }

        // 3. TEAM visibility: Visible to all team members
        if (task.visibility === Visibility.TEAM) {
            if (task.createdById === userId || task.assignedToId === userId) {
                return next();
            }

            const isMember = task.team?.members.some(m => m.userId === userId);
            if (isMember) {
                return next();
            }
            return res.status(403).json({ error: 'Access denied to team task' });
        }

        next();
    } catch (error) {
        console.error('Visibility check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
