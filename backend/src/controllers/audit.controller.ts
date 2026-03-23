import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getTeamLogs = async (req: AuthRequest, res: Response) => {
    try {
        const teamId = req.params.teamId as string;

        // Verify membership
        const membership = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: req.userId!
                }
            }
        });

        if (!membership) return res.status(403).json({ error: 'Access denied' });

        const logs = await prisma.auditLog.findMany({
            where: { teamId },
            include: {
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
