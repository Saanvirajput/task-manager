import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getIntegrations = async (req: AuthRequest, res: Response) => {
    try {
        const { workspaceId } = req.params;

        // Verify membership and role
        const membership = await (prisma as any).workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: req.userId!
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const integrations = await (prisma as any).integration.findMany({
            where: { workspaceId }
        });

        res.json(integrations);
    } catch (error) {
        console.error('Fetch integrations error:', error);
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
};

export const createIntegration = async (req: AuthRequest, res: Response) => {
    try {
        const { workspaceId } = req.params;
        const { type, webhookUrl } = req.body;

        if (!type || !webhookUrl) {
            return res.status(400).json({ error: 'Type and Webhook URL are required' });
        }

        // Verify admin/owner role
        const membership = await (prisma as any).workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: req.userId!
                }
            }
        });

        if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OWNER')) {
            return res.status(403).json({ error: 'Only admins can manage integrations' });
        }

        const integration = await (prisma as any).integration.create({
            data: {
                type,
                webhookUrl,
                workspaceId
            }
        });

        res.status(201).json(integration);
    } catch (error) {
        console.error('Create integration error:', error);
        res.status(500).json({ error: 'Failed to create integration' });
    }
};

export const deleteIntegration = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const integration = await (prisma as any).integration.findUnique({
            where: { id }
        });

        if (!integration) {
            return res.status(404).json({ error: 'Integration not found' });
        }

        // Verify admin/owner role for the workspace
        const membership = await (prisma as any).workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId: integration.workspaceId,
                    userId: req.userId!
                }
            }
        });

        if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OWNER')) {
            return res.status(403).json({ error: 'Only admins can delete integrations' });
        }

        await (prisma as any).integration.delete({
            where: { id }
        });

        res.json({ message: 'Integration deleted successfully' });
    } catch (error) {
        console.error('Delete integration error:', error);
        res.status(500).json({ error: 'Failed to delete integration' });
    }
};
