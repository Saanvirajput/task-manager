import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getWorkloadAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { workspaceId } = req.params;

        // Check if the user is a member of the workspace
        const membership = await (prisma as any).workspaceMember.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: req.userId!
                }
            }
        });

        if (!membership) {
            return res.status(403).json({ error: 'Access denied to this workspace' });
        }

        // Fetch all members of the workspace
        const members = await (prisma as any).workspaceMember.findMany({
            where: { workspaceId },
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        // Fetch all tasks in the workspace
        const tasks = await (prisma as any).task.findMany({
            where: { workspaceId, parentId: null } // Only consider top-level tasks for workload summary
        });

        const workloadData = members.map((member: any) => {
            const userTasks = tasks.filter((t: any) => t.userId === member.userId);
            const total = userTasks.length;
            const completed = userTasks.filter((t: any) => t.status === 'DONE').length;
            const inProgress = userTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
            const todo = userTasks.filter((t: any) => t.status === 'TODO').length;

            // Calculate a Simulated AI Health Score:
            // 100 = Perfect distribution
            // Deductions for overdue tasks, high-priority pileups, etc.
            const now = new Date();
            const highPriorityUnfinished = userTasks.filter((t: any) => t.status !== 'DONE' && t.priority === 'HIGH').length;
            const overdueTasks = userTasks.filter((t: any) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now).length;

            // Formula: Base 100 - (Overdue * 15) - (High Priority Pileup * 5) - (Large Backlog * 2)
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
