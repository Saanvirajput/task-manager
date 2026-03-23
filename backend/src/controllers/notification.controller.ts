import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const notifications = await prisma.notification.findMany({
            where: { userId },
            include: {
                task: {
                    select: { id: true, title: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.notification.update({
            where: { id, userId: req.userId! },
            data: { isRead: true }
        });
        res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.userId!, isRead: false },
            data: { isRead: true }
        });
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
