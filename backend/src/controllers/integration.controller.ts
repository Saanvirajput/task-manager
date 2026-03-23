import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createIntegration = async (req: AuthRequest, res: Response) => {
    try {
        const { teamId, type, webhookUrl } = req.body;

        if (!teamId || !type || !webhookUrl) {
            return res.status(400).json({ error: 'Team ID, type, and webhookUrl are required' });
        }

        const integration = await (prisma as any).integration.create({
            data: {
                teamId,
                type,
                webhookUrl,
            }
        });

        res.status(201).json(integration);
    } catch (error) {
        console.error('Create Integration Error:', error);
        res.status(500).json({ error: 'Failed to create integration' });
    }
};

export const getTeamIntegrations = async (req: AuthRequest, res: Response) => {
    try {
        const { teamId } = req.params;
        const integrations = await (prisma as any).integration.findMany({
            where: { teamId }
        });
        res.json(integrations);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
};

export const deleteIntegration = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await (prisma as any).integration.delete({ where: { id } });
        res.json({ message: 'Integration deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete integration' });
    }
};
