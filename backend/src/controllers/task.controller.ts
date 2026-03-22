import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient, Status, Priority } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parsePdfTasks } from '../utils/pdfParser';

const prisma = new PrismaClient();

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, status, priority, cveId, dueDate, reminderTime, parentId, workspaceId, dependsOnIds, recurrence } = req.body;

        if (workspaceId) {
            const membership = await (prisma as any).workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId: req.userId!
                    }
                }
            });
            if (!membership || membership.role === 'VIEWER') {
                return res.status(403).json({ error: 'Permission denied in this workspace' });
            }
        }

        let computedReminderTime = reminderTime ? new Date(reminderTime) : undefined;
        const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
        if (parsedDueDate && !computedReminderTime) {
            computedReminderTime = new Date(parsedDueDate.getTime() - 60 * 60 * 1000);
        }

        const taskData: any = {
            title,
            description,
            status: (status as Status) || Status.TODO,
            priority: (priority as Priority) || Priority.MEDIUM,
            cveId,
            dueDate: parsedDueDate,
            reminderTime: computedReminderTime,
            attachmentName: req.file?.originalname,
            attachmentUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
            userId: req.userId!,
            parentId: parentId || null,
            workspaceId: workspaceId || null,
            recurrence: recurrence || null,
        };

        // Connect dependencies if provided
        if (dependsOnIds && Array.isArray(dependsOnIds) && dependsOnIds.length > 0) {
            taskData.dependsOn = { connect: dependsOnIds.map((id: string) => ({ id })) };
        }

        const task = await prisma.task.create({
            data: taskData,
            include: { dependsOn: { select: { id: true, title: true } } }
        });
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const workspaceId = req.query.workspaceId as string;

        const where: any = {
            userId: !workspaceId ? req.userId : undefined,
            workspaceId: workspaceId || null,
            parentId: req.query.parentId === 'any' ? undefined : (req.query.parentId || null)
        };

        if (workspaceId) {
            const membership = await (prisma as any).workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId: req.userId!
                    }
                }
            });
            if (!membership) return res.status(403).json({ error: 'Access denied' });
            delete where.userId; // Allow all workspace tasks
        }

        const status = req.query.status as string;
        const priority = req.query.priority as string;
        const search = req.query.search as string;
        const from = req.query.from as string;
        const to = req.query.to as string;

        if (status) where.status = status as Status;
        if (priority) where.priority = priority as Priority;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (from || to) {
            where.createdAt = {};
            if (from) where.createdAt.gte = new Date(from);
            if (to) where.createdAt.lte = new Date(to);
        }

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                skip,
                take,
                include: {
                    subTasks: {
                        select: { id: true, status: true }
                    },
                    dependsOn: {
                        select: { id: true, title: true, status: true }
                    },
                    dependedBy: {
                        select: { id: true, title: true, status: true }
                    }
                } as any,
                orderBy: { createdAt: 'desc' } as any
            }),
            prisma.task.count({ where })
        ]);

        res.json({
            tasks,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, cveId, dueDate, reminderTime, parentId, dependsOnIds, recurrence } = req.body;

        let computedReminderTime = reminderTime ? new Date(reminderTime) : undefined;
        const parsedDueDate = dueDate ? new Date(dueDate) : undefined;
        if (parsedDueDate && !computedReminderTime) {
            computedReminderTime = new Date(parsedDueDate.getTime() - 60 * 60 * 1000);
        }

        const updateData: any = {
            title,
            description,
            status: status as Status,
            priority: priority as Priority,
            cveId,
            parentId: parentId === undefined ? undefined : (parentId || null),
            ...(parsedDueDate && { dueDate: parsedDueDate }),
            ...(computedReminderTime && { reminderTime: computedReminderTime, isNotified: false }),
            ...(req.file && {
                attachmentName: req.file.originalname,
                attachmentUrl: `/uploads/${req.file.filename}`
            }),
        };

        if (recurrence !== undefined) {
            updateData.recurrence = recurrence || null;
        }

        // If task is marked DONE, set completedAt and handle recurrence
        if (status === 'DONE') {
            updateData.isOverdueNotified = true;
            updateData.completedAt = new Date();
        }

        const taskToUpdate: any = await prisma.task.findUnique({ where: { id: id as string } });
        if (!taskToUpdate) return res.status(404).json({ error: 'Task not found' });

        // Permission check
        if (taskToUpdate.userId !== req.userId) {
            if (!taskToUpdate.workspaceId) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const membership = await (prisma as any).workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: taskToUpdate.workspaceId,
                        userId: req.userId!
                    }
                }
            });
            if (!membership || membership.role === 'VIEWER') {
                return res.status(403).json({ error: 'Permission denied in this workspace' });
            }
        }

        // Handle dependency updates
        if (dependsOnIds !== undefined && Array.isArray(dependsOnIds)) {
            updateData.dependsOn = {
                set: dependsOnIds.map((depId: string) => ({ id: depId }))
            };
        }

        await prisma.task.update({
            where: { id: id as string },
            data: updateData
        });

        // Auto-create next recurring task on completion
        if (status === 'DONE' && taskToUpdate.recurrence && taskToUpdate.status !== 'DONE') {
            const nextDue = calculateNextOccurrence(taskToUpdate.dueDate, taskToUpdate.recurrence);
            await prisma.task.create({
                data: {
                    title: taskToUpdate.title,
                    description: taskToUpdate.description,
                    priority: taskToUpdate.priority,
                    status: 'TODO',
                    userId: taskToUpdate.userId,
                    workspaceId: taskToUpdate.workspaceId,
                    recurrence: taskToUpdate.recurrence,
                    dueDate: nextDue,
                    reminderTime: nextDue ? new Date(nextDue.getTime() - 60 * 60 * 1000) : null,
                }
            });
        }

        const updatedTask = await prisma.task.findUnique({
            where: { id: id as string },
            include: {
                dependsOn: { select: { id: true, title: true, status: true } },
                dependedBy: { select: { id: true, title: true, status: true } }
            } as any
        });
        res.json(updatedTask);
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

function calculateNextOccurrence(currentDue: Date | null, recurrence: string): Date | null {
    const base = currentDue ? new Date(currentDue) : new Date();
    switch (recurrence) {
        case 'DAILY': base.setDate(base.getDate() + 1); break;
        case 'WEEKLY': base.setDate(base.getDate() + 7); break;
        case 'MONTHLY': base.setMonth(base.getMonth() + 1); break;
        default: return null;
    }
    return base;
}

export const extractTasksFromPdf = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file provided' });
        }

        const filePath = path.join(__dirname, '../../', req.file.path);
        const dataBuffer = fs.readFileSync(filePath);

        const extractedPlan = await parsePdfTasks(dataBuffer);

        // Delete temporary file after extraction
        fs.unlinkSync(filePath);

        res.json(extractedPlan);
    } catch (error) {
        console.error('Extraction Error:', error);
        res.status(500).json({ error: 'Failed to extract tasks from PDF' });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const taskToDelete: any = await prisma.task.findUnique({ where: { id: id as string } });
        if (!taskToDelete) return res.status(404).json({ error: 'Task not found' });

        // Permission check
        if (taskToDelete.userId !== req.userId) {
            if (!taskToDelete.workspaceId) {
                return res.status(403).json({ error: 'Access denied' });
            }
            const membership = await (prisma as any).workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId: taskToDelete.workspaceId,
                        userId: req.userId!
                    }
                }
            });
            if (!membership || membership.role === 'VIEWER' || membership.role === 'MEMBER') {
                // Only ADMIN or Owner can delete in some enterprise configs, 
                // but let's allow ADMIN for now specifically for workspace tasks.
                if (membership?.role !== 'ADMIN') {
                    return res.status(403).json({ error: 'Only admins can delete workspace tasks' });
                }
            }
        }

        await prisma.task.delete({
            where: { id: id as string }
        });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
