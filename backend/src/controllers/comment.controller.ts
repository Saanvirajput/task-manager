import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any;

export const getComments = async (req: AuthRequest, res: Response) => {
    try {
        const { id: taskId } = req.params;

        const comments = await prisma.comment.findMany({
            where: { taskId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                mentions: {
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        res.json(comments);
    } catch (error) {
        console.error('Fetch comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
};

export const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id: taskId } = req.params;
        const { content, mentions } = req.body; // mentions is array of user IDs

        if (!content) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                taskId,
                userId: req.userId!,
                mentions: mentions && mentions.length > 0 ? {
                    create: mentions.map((userId: string) => ({ userId }))
                } : undefined
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                mentions: {
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    }
                }
            }
        });

        // Create notifications for mentioned users
        if (mentions && mentions.length > 0) {
            const author = await prisma.user.findUnique({ where: { id: req.userId! }, select: { name: true, email: true } });
            const authorName = author?.name || author?.email || 'Someone';

            await prisma.notification.createMany({
                data: mentions.map((userId: string) => ({
                    userId,
                    taskId,
                    type: 'MENTION',
                    message: `${authorName} mentioned you in a comment on task "${task.title}"`
                }))
            });
        }

        res.status(201).json(comment);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;

        const comment = await prisma.comment.findUnique({ where: { id: commentId } });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        if (comment.userId !== req.userId!) {
            return res.status(403).json({ error: 'You can only delete your own comments' });
        }

        await prisma.comment.delete({ where: { id: commentId } });

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
};
