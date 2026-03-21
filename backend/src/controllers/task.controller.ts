import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient, Status, Priority } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parsePdfTasks } from '../utils/pdfParser';

const prisma = new PrismaClient();

export const createTask = async (req: AuthRequest, res: Response) => {
    try {
        console.log('Creating task:', req.body, 'for user:', req.userId);
        const { title, description, status, priority, cveId } = req.body;
        const task = await prisma.task.create({
            data: {
                title,
                description,
                status: (status as Status) || Status.TODO,
                priority: (priority as Priority) || Priority.MEDIUM,
                cveId,
                attachmentName: req.file?.originalname,
                attachmentUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
                userId: req.userId!
            }
        });
        console.log('Task created successfully:', task.id);
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

        const where: any = { userId: req.userId };

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
        const { title, description, status, priority, cveId } = req.body;

        await prisma.task.updateMany({
            where: {
                id: id as string,
                userId: req.userId!
            },
            data: {
                title,
                description,
                status: status as Status,
                priority: priority as Priority,
                cveId,
                ...(req.file && {
                    attachmentName: req.file.originalname,
                    attachmentUrl: `/uploads/${req.file.filename}`
                })
            }
        });

        const updatedTask = await prisma.task.findUnique({ where: { id: id as string } });
        res.json(updatedTask);
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
};

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
        const result = await prisma.task.deleteMany({
            where: { id: id as string, userId: req.userId }
        });

        if (result.count === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
