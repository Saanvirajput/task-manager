import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId! },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                task: {
                    select: { id: true, title: true, status: true, priority: true }
                }
            }
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: req.userId!, isRead: false }
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.notification.updateMany({
            where: { id, userId: req.userId! },
            data: { isRead: true }
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification:', error);
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        await prisma.notification.updateMany({
            where: { userId: req.userId!, isRead: false },
            data: { isRead: true }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};
