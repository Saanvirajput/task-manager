import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { id: workspaceId } = req.params;
        const limit = Number(req.query.limit) || 50;

        // Verify ADMIN access
        const membership = await prisma.workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: workspaceId as string,
                    userId: req.userId!
                }
            }
        });

        if (!membership || membership.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can view audit logs' });
        }

        const logs = await prisma.auditLog.findMany({
            where: { workspaceId: workspaceId as string },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        res.json(logs);
    } catch (error) {
        console.error('Audit Log Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
