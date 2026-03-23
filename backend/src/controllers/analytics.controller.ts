import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getWorkloadAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const teamId = req.params.teamId as string;

        // Check if the user is a member of the team
        const membership = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: req.userId!
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Access denied to this team' });
        }

        // Fetch all members of the team
        const members = await prisma.teamMember.findMany({
            where: { teamId },
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        // Fetch all tasks in the team
        const tasks = await prisma.task.findMany({
            where: { teamId, parentId: null }
        });

        const workloadData = members.map((member: any) => {
            // Check tasks assigned to the member
            const userTasks = tasks.filter((t: any) => t.assignedToId === member.userId);
            const total = userTasks.length;
            const completed = userTasks.filter((t: any) => t.status === 'DONE').length;
            const inProgress = userTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
            const todo = userTasks.filter((t: any) => t.status === 'TODO').length;

            const now = new Date();
            const highPriorityUnfinished = userTasks.filter((t: any) => t.status !== 'DONE' && t.priority === 'HIGH').length;
            const overdueTasks = userTasks.filter((t: any) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now).length;

            const deductions = (overdueTasks * 15) + (highPriorityUnfinished * 5) + (todo > 5 ? (todo - 5) * 2 : 0);
            const healthScore = Math.max(0, 100 - deductions);

            return {
                userId: member.userId,
                name: member.user.name || member.user.email,
                stats: { total, completed, inProgress, todo },
                healthScore
            };
        });

        res.json(workloadData);
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Internal server error calculating analytics' });
    }
};
