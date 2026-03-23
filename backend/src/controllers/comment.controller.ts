import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const taskId = req.params.taskId as string;
        const { content, mentions } = req.body;

        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                userId: req.userId!,
                mentions: mentions && Array.isArray(mentions) ? {
                    create: mentions.map((userId: string) => ({ userId }))
                } : undefined
            },
            include: {
                user: { select: { id: true, name: true } },
                mentions: { include: { user: { select: { id: true, name: true } } } }
            }
        });

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

export const getTaskComments = async (req: AuthRequest, res: Response) => {
    try {
        const taskId = req.params.taskId as string;
        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: {
                user: { select: { id: true, name: true } },
                mentions: { include: { user: { select: { id: true, name: true } } } }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};
