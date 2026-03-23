import cron from 'node-cron';
import { PrismaClient, Status, NotificationType } from '@prisma/client';
import { sendSlackNotification } from '../services/integration.service';
import { logAuditAction } from '../services/audit.service';
import { generateAIInsights } from '../services/gemini.service';

const prisma = new PrismaClient();

export const startReminderJob = () => {
    // 1. Task Reminders (Every minute)
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const reminders = await prisma.task.findMany({
                where: {
                    status: { not: Status.DONE },
                    reminderTime: { lte: now },
                    isNotified: false
                }
            });

            for (const task of reminders) {
                await prisma.notification.create({
                    data: {
                        userId: task.assignedToId || task.createdById,
                        taskId: task.id,
                        message: `⏰ Reminder: "${task.title}" is due soon.`,
                        type: NotificationType.REMINDER
                    }
                });

                await prisma.task.update({
                    where: { id: task.id },
                    data: { isNotified: true }
                });

                if (task.teamId) {
                    await sendSlackNotification(task.teamId, `⏰ *Reminder*: Task "${task.title}" is flagged for immediate attention.`);
                }
            }
        } catch (error) {
            console.error('Reminder Job Error:', error);
        }
    });

    // 2. Overdue Alerts (Every hour)
    cron.schedule('0 * * * *', async () => {
        try {
            const now = new Date();
            const overdueTasks = await prisma.task.findMany({
                where: {
                    status: { not: Status.DONE },
                    dueDate: { lte: now },
                    isOverdueNotified: false
                }
            });

            for (const task of overdueTasks) {
                await prisma.notification.create({
                    data: {
                        userId: task.assignedToId || task.createdById,
                        taskId: task.id,
                        message: `🚨 Overdue: "${task.title}" has passed its deadline!`,
                        type: NotificationType.OVERDUE
                    }
                });

                await prisma.task.update({
                    where: { id: task.id },
                    data: { isOverdueNotified: true }
                });

                if (task.teamId) {
                    await sendSlackNotification(task.teamId, `🚨 *Overdue Alert*: "${task.title}" is now past its deadline!`);
                }
            }
        } catch (error) {
            console.error('Overdue Job Error:', error);
        }
    });

    // 3. Daily AI Coaching & Summary (21:00)
    cron.schedule('0 21 * * *', async () => {
        try {
            const teams = await prisma.team.findMany();
            for (const team of teams) {
                const tasks = await prisma.task.findMany({ where: { teamId: team.id } });
                const done = tasks.filter(t => t.status === Status.DONE).length;
                const total = tasks.length;

                // Get AI Insight via Gemini
                const context = tasks.map(t => `${t.title} (${t.status})`).join(', ');
                const aiInsight = await generateAIInsights(context);

                const summary = `📊 *Daily Team Summary*\n- Tasks: ${done}/${total} completed\n- AI Coach: ${aiInsight}`;
                await sendSlackNotification(team.id, summary);
            }
        } catch (error) {
            console.error('Daily Summary Error:', error);
        }
    });
};
