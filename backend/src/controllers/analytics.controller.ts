import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../utils/prisma';

export const getAnalyticsOverview = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const [totalTasks, completedTasks, pendingTasks] = await Promise.all([
            prisma.task.count({ where: { userId } }),
            prisma.task.count({ where: { userId, status: 'DONE' } }),
            prisma.task.count({ where: { userId, status: { not: 'DONE' } } })
        ]);

        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        // Average Completion Time
        const doneTasks = await prisma.task.findMany({
            where: { userId, status: 'DONE', completedAt: { not: null } },
            select: { createdAt: true, completedAt: true }
        });

        const averageCompletionTime = doneTasks.length > 0
            ? doneTasks.reduce((acc, task) => acc + (task.completedAt!.getTime() - task.createdAt.getTime()), 0) / doneTasks.length
            : 0;

        // Tasks Created Per Day (last 7 days) using Postgres syntax
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const tasksCreatedPerDayRaw = await prisma.$queryRaw`
      SELECT DATE("createdAt") as date, count(*)::int as count
      FROM "Task"
      WHERE "userId" = ${userId} AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt") ASC
    `;

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            completionRate: Number(completionRate.toFixed(2)),
            averageCompletionTime: Math.round(averageCompletionTime / (1000 * 60 * 60)), // in hours
            tasksCreatedPerDay: tasksCreatedPerDayRaw
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};
