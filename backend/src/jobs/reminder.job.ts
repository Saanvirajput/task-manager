import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendSlackMessage } from '../services/slack.service';
import { generateAIInsight } from '../services/ai.service';

const prisma = new PrismaClient();

export const startReminderJob = () => {
    // 1. Minute Cron: Reminders & Overdue Alerts
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        console.log(`[CRON] Running reminder/overdue checks at ${now.toISOString()}`);

        try {
            // -- Handle upcoming task reminders --
            const reminderTasks = await prisma.task.findMany({
                where: {
                    reminderTime: { lte: now },
                    isNotified: false,
                },
                include: { user: true },
            });

            for (const task of reminderTasks) {
                // Internal Notification
                await prisma.notification.create({
                    data: {
                        message: `⏰ Reminder: "${task.title}" is coming up soon!`,
                        type: 'REMINDER',
                        userId: task.userId,
                        taskId: task.id,
                    },
                });

                // Slack Notification
                const slackMsg = `🚨 *Task Reminder*\nTask: ${task.title}\nPriority: ${task.priority}\nDue: ${task.dueDate?.toLocaleDateString() || 'N/A'}`;
                await sendSlackMessage(slackMsg);

                await prisma.task.update({
                    where: { id: task.id },
                    data: { isNotified: true },
                });

                console.log(`[CRON] Reminder sent for task: ${task.title}`);
            }

            // -- Handle overdue tasks --
            const overdueTasks = await prisma.task.findMany({
                where: {
                    dueDate: { lt: now },
                    status: { not: 'DONE' },
                    isOverdueNotified: false,
                },
                include: { user: true },
            });

            for (const task of overdueTasks) {
                // Internal Notification
                const priorityEmoji = task.priority === 'HIGH' ? '🔴' : task.priority === 'MEDIUM' ? '🟡' : '🟢';
                await prisma.notification.create({
                    data: {
                        message: `${priorityEmoji} Overdue: "${task.title}" was due on ${task.dueDate?.toLocaleDateString()}!`,
                        type: 'OVERDUE',
                        userId: task.userId,
                        taskId: task.id,
                    },
                });

                // Slack Notification
                const slackMsg = `⚠️ *Task Overdue*\nTask: ${task.title}\nWas due: ${task.dueDate?.toLocaleDateString() || 'N/A'}`;
                await sendSlackMessage(slackMsg);

                await prisma.task.update({
                    where: { id: task.id },
                    data: { isOverdueNotified: true },
                });

                console.log(`[CRON] Overdue alert sent for task: ${task.title}`);
            }
        } catch (error) {
            console.error('[CRON] Minute Job Error:', error);
        }
    });

    // 2. Daily Cron (21:00): Summary & AI Insight
    cron.schedule('0 21 * * *', async () => {
        console.log(`[CRON] Generating daily productivity summary at ${new Date().toISOString()}`);
        try {
            const total = await prisma.task.count();
            const completed = await prisma.task.count({ where: { status: 'DONE' } });
            const pending = await prisma.task.count({ where: { status: { not: 'DONE' } } });
            const overdue = await prisma.task.count({
                where: {
                    status: { not: 'DONE' },
                    dueDate: { lt: new Date() }
                }
            });

            // Summary Message
            const summaryMsg = `📊 *Daily Summary*\n✔ Completed: ${completed}\n📌 Total: ${total}\n⏳ Pending: ${pending}\n⚠ Overdue: ${overdue}`;
            await sendSlackMessage(summaryMsg);

            // AI Insight Message
            const insightText = await generateAIInsight({ total, completed, pending, overdue });
            const aiMsg = `🧠 *AI Insight*\n${insightText}`;
            await sendSlackMessage(aiMsg);

            console.log('[CRON] Daily summary and AI insight sent to Slack');
        } catch (error) {
            console.error('[CRON] Daily Job Error:', error);
        }
    });

    console.log('✅ TaskFlow Notification Jobs Initialized (Minute: Alerts, 21:00: Summary)');
};
