import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const startReminderJob = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        console.log(`[CRON] Running reminder check at ${now.toISOString()}`);

        try {
            // 1. Handle upcoming task reminders
            const reminderTasks = await prisma.task.findMany({
                where: {
                    reminderTime: { lte: now },
                    isNotified: false,
                },
                include: { user: true },
            });

            for (const task of reminderTasks) {
                await prisma.notification.create({
                    data: {
                        message: `⏰ Reminder: "${task.title}" is coming up soon!`,
                        type: 'REMINDER',
                        userId: task.userId,
                        taskId: task.id,
                    },
                });

                await prisma.task.update({
                    where: { id: task.id },
                    data: { isNotified: true },
                });

                console.log(`[CRON] Reminder sent for task: ${task.title}`);
            }

            // 2. Handle overdue tasks
            const overdueTasks = await prisma.task.findMany({
                where: {
                    dueDate: { lt: now },
                    status: { not: 'DONE' },
                    isOverdueNotified: false,
                },
                include: { user: true },
            });

            for (const task of overdueTasks) {
                const priorityEmoji = task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : '🟢';

                await prisma.notification.create({
                    data: {
                        message: `${priorityEmoji} Overdue: "${task.title}" was due on ${task.dueDate!.toLocaleDateString()}!`,
                        type: 'OVERDUE',
                        userId: task.userId,
                        taskId: task.id,
                    },
                });

                await prisma.task.update({
                    where: { id: task.id },
                    data: { isOverdueNotified: true },
                });

                console.log(`[CRON] Overdue alert sent for task: ${task.title}`);
            }

            if (reminderTasks.length === 0 && overdueTasks.length === 0) {
                console.log(`[CRON] No pending reminders or overdue tasks.`);
            }
        } catch (error) {
            console.error('[CRON] Error in reminder job:', error);
        }
    });

    console.log('✅ Reminder cron job started (runs every minute)');
};
