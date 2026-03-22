import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient() as any;

/**
 * Middleware to enforce strict RBAC for workspace-related routes.
 * It dynamically extracts the workspaceId from req.params.id, req.params.workspaceId, or req.body.workspaceId.
 */
export const requireRole = (allowedRoles: Role[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // Find workspaceId from various possible request locations
            const workspaceId = req.params.id || req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

            if (!workspaceId) {
                // If there's no workspace context, RBAC for workspace doesn't apply.
                // You might choose to block this or pass it through depending on your exact requirements.
                // For a strict approach on workspace routes, if no ID is provided, it's a structural error.
                return res.status(400).json({ error: 'Workspace ID is missing for role enforcement' });
            }

            const membership = await prisma.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: workspaceId as string,
                        userId: req.userId!
                    }
                }
            });

            if (!membership) {
                return res.status(403).json({ error: 'You are not a member of this workspace' });
            }

            if (!allowedRoles.includes(membership.role)) {
                return res.status(403).json({
                    error: `Access denied. Requires one of: ${allowedRoles.join(', ')}`
                });
            }

            // Role is valid, proceed
            next();
        } catch (error) {
            console.error('RBAC Middleware Error:', error);
            res.status(500).json({ error: 'Internal server error during role validation' });
        }
    };
};
