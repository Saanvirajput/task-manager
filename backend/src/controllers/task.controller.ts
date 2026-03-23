import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient, Status, Priority, Visibility, Role } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parsePdfTasks } from '../utils/pdfParser';
import { logAuditAction } from '../services/audit.service';
import { sendSlackNotification } from '../services/integration.service';
import { syncTaskToGoogleCalendar, deleteTaskFromGoogleCalendar } from '../services/google-calendar.service';

const prisma = new PrismaClient();

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        const {
            title, description, status, priority, cveId, dueDate,
            reminderTime, parentId, teamId, dependsOnIds,
            recurrence, customFields, assignedToId, visibility
        } = req.body;

        if (teamId) {
            const membership = await prisma.teamMember.findUnique({
                where: {
                    teamId_userId: {
                        teamId,
                        userId: req.userId!
                    }
                }
            });
            // Only ADMIN and MANAGER can assign tasks to others
            if (!membership || membership.role === Role.MEMBER) {
                if (assignedToId && assignedToId !== req.userId) {
                    return res.status(403).json({ error: 'Only Admins/Managers can assign tasks to others' });
                }
            }
            if (!membership) {
                return res.status(403).json({ error: 'Permission denied in this team' });
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
            visibility: (visibility as Visibility) || Visibility.TEAM,
            cveId,
            dueDate: parsedDueDate,
            reminderTime: computedReminderTime,
            attachmentName: req.file?.originalname,
            attachmentUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
            createdById: req.userId!,
            assignedToId: assignedToId || req.userId!, // Default to creator if not assigned
            parentId: parentId || null,
            teamId: teamId || null,
            recurrence: recurrence || null,
            customFields: customFields || {},
        };

        if (dependsOnIds && Array.isArray(dependsOnIds) && dependsOnIds.length > 0) {
            taskData.dependsOn = { connect: dependsOnIds.map((id: string) => ({ id })) };
        }

        const task = await prisma.task.create({
            data: taskData,
            include: {
                dependsOn: { select: { id: true, title: true } },
                createdBy: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true } }
            }
        });

        await logAuditAction({
            action: 'TASK_CREATED',
            resourceType: 'TASK',
            resourceId: task.id,
            userId: req.userId!,
            teamId: teamId || undefined,
            details: { title: task.title, visibility: task.visibility }
        });

        if (teamId) {
            await sendSlackNotification(teamId, `🚀 *New Task Created*: "${task.title}" (Priority: ${task.priority})`);
        }

        if (task.dueDate) {
            syncTaskToGoogleCalendar(req.userId!, task as any);
        }

        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const getTasks = async (req: AuthRequest, res: Response) => {
    try {
        const { page = 1, limit = 10, teamId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const userId = req.userId!;

        // Base filter: tasks created by or assigned to user OR public
        const where: any = {
            AND: [
                {
                    OR: [
                        { createdById: userId },
                        { assignedToId: userId },
                        { visibility: Visibility.PUBLIC },
                        {
                            AND: [
                                { visibility: Visibility.TEAM },
                                { teamId: (teamId as string) || undefined },
                                {
                                    team: {
                                        members: {
                                            some: { userId: userId }
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        if (teamId) {
            where.AND.push({ teamId: teamId as string });
        }

        const status = req.query.status as string;
        const priority = req.query.priority as string;
        const search = req.query.search as string;

        if (status) where.AND.push({ status: status as Status });
        if (priority) where.AND.push({ priority: priority as Priority });
        if (search) {
            where.AND.push({
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ]
            });
        }

        const [tasks, total] = await Promise.all([
            prisma.task.findMany({
                where,
                skip,
                take,
                include: {
                    createdBy: { select: { id: true, name: true } },
                    assignedTo: { select: { id: true, name: true } },
                    subTasks: { select: { id: true, status: true } },
                    dependsOn: { select: { id: true, title: true, status: true } },
                    dependedBy: { select: { id: true, title: true, status: true } }
                },
                orderBy: { createdAt: 'desc' }
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
        console.error('Fetch tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const updateTask = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const {
            title, description, status, priority, cveId, dueDate,
            reminderTime, parentId, dependsOnIds, recurrence,
            customFields, assignedToId, visibility
        } = req.body;

        const taskToUpdate = await prisma.task.findUnique({
            where: { id },
            include: { team: { include: { members: true } } }
        });

        if (!taskToUpdate) return res.status(404).json({ error: 'Task not found' });

        // Permission check
        const membership = taskToUpdate.teamId ? await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId: taskToUpdate.teamId, userId: req.userId! } }
        }) : null;

        const isOwner = taskToUpdate.createdById === req.userId;
        const isAssignee = taskToUpdate.assignedToId === req.userId;
        const isAdminOrManager = membership && (membership.role === Role.ADMIN || membership.role === Role.MANAGER);

        if (!isOwner && !isAssignee && !isAdminOrManager) {
            return res.status(403).json({ error: 'Insufficient permissions to update this task' });
        }

        // Only ADMIN/MANAGER can re-assign or change visibility of team tasks
        if (taskToUpdate.teamId && !isAdminOrManager && (assignedToId || visibility)) {
            if (assignedToId && assignedToId !== taskToUpdate.assignedToId) {
                return res.status(403).json({ error: 'Only Admins/Managers can re-assign team tasks' });
            }
        }

        let computedReminderTime = reminderTime ? new Date(reminderTime) : undefined;
        const parsedDueDate = dueDate ? new Date(dueDate) : undefined;

        const updateData: any = {
            title,
            description,
            status: status as Status,
            priority: priority as Priority,
            visibility: visibility as Visibility,
            assignedToId,
            cveId,
            parentId: parentId === undefined ? undefined : (parentId || null),
            ...(parsedDueDate && { dueDate: parsedDueDate }),
            ...(computedReminderTime && { reminderTime: computedReminderTime, isNotified: false }),
            ...(req.file && {
                attachmentName: req.file.originalname,
                attachmentUrl: `/uploads/${req.file.filename}`
            }),
        };

        if (recurrence !== undefined) updateData.recurrence = recurrence || null;
        if (customFields !== undefined) updateData.customFields = customFields || {};

        if (status === Status.DONE) {
            updateData.isOverdueNotified = true;
            updateData.completedAt = new Date();
        }

        // Smart Completion Logic: If overdue, we could auto-mark or warn
        // (Handled here as a reactive check)
        const isOverdue = taskToUpdate.dueDate && new Date(taskToUpdate.dueDate) < new Date();
        if (isOverdue && status !== Status.DONE && !taskToUpdate.completedAt) {
            // Optional: Mark as MISSED flag??
        }

        await prisma.task.update({
            where: { id },
            data: updateData
        });

        const updatedTask = await prisma.task.findUnique({
            where: { id },
            include: {
                createdBy: { select: { id: true, name: true } },
                assignedTo: { select: { id: true, name: true } },
                dependsOn: { select: { id: true, title: true, status: true } },
                dependedBy: { select: { id: true, title: true, status: true } }
            }
        });

        await logAuditAction({
            action: 'TASK_UPDATED',
            resourceType: 'TASK',
            resourceId: id,
            userId: req.userId!,
            teamId: taskToUpdate.teamId || undefined,
            details: { previousStatus: taskToUpdate.status, newStatus: status }
        });

        if (status === Status.DONE && taskToUpdate.status !== Status.DONE && taskToUpdate.teamId) {
            await sendSlackNotification(taskToUpdate.teamId, `✅ *Task Completed*: "${updatedTask?.title || taskToUpdate.title}"`);
        }

        if (updatedTask && updatedTask.dueDate) {
            syncTaskToGoogleCalendar(req.userId!, updatedTask as any);
        }

        res.json(updatedTask);
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const taskToDelete = await prisma.task.findUnique({ where: { id } });
        if (!taskToDelete) return res.status(404).json({ error: 'Task not found' });

        const membership = taskToDelete.teamId ? await prisma.teamMember.findUnique({
            where: { teamId_userId: { teamId: taskToDelete.teamId, userId: req.userId! } }
        }) : null;

        const isOwner = taskToDelete.createdById === req.userId;
        const isAdmin = membership && membership.role === Role.ADMIN;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Only the creator or an Admin can delete this task' });
        }

        if (taskToDelete.googleEventId) {
            deleteTaskFromGoogleCalendar(req.userId!, taskToDelete.googleEventId);
        }

        await prisma.task.delete({ where: { id } });

        await logAuditAction({
            action: 'TASK_DELETED',
            resourceType: 'TASK',
            resourceId: id,
            userId: req.userId!,
            teamId: taskToDelete.teamId || undefined,
            details: { title: taskToDelete.title }
        });

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};

export const extractTasksFromPdf = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });
        const filePath = path.join(__dirname, '../../', req.file.path);
        const dataBuffer = fs.readFileSync(filePath);
        const extractedPlan = await parsePdfTasks(dataBuffer);
        fs.unlinkSync(filePath);
        res.json(extractedPlan);
    } catch (error) {
        res.status(500).json({ error: 'Failed to extract tasks' });
    }
};
