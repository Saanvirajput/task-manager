import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
);

export const syncTaskToGoogleCalendar = async (userId: string, task: any) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.googleAccessToken || !user.calendarSyncEnabled || !task.dueDate) {
            return;
        }

        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken || undefined,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const event = {
            summary: task.title,
            description: task.description || '',
            start: {
                dateTime: new Date(task.dueDate).toISOString(),
            },
            end: {
                dateTime: new Date(new Date(task.dueDate).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
            },
        };

        if (task.googleEventId) {
            try {
                await calendar.events.update({
                    calendarId: 'primary',
                    eventId: task.googleEventId,
                    requestBody: event,
                });
            } catch (err: any) {
                // If event not found, create a new one
                if (err.code === 404) {
                    const { data } = await calendar.events.insert({
                        calendarId: 'primary',
                        requestBody: event,
                    });
                    await prisma.task.update({
                        where: { id: task.id },
                        data: { googleEventId: data.id || null },
                    });
                } else {
                    throw err;
                }
            }
        } else {
            const { data } = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
            });
            await prisma.task.update({
                where: { id: task.id },
                data: { googleEventId: data.id || null },
            });
        }
    } catch (error) {
        console.error('Failed to sync to Google Calendar:', error);
    }
};

export const deleteTaskFromGoogleCalendar = async (userId: string, googleEventId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.googleAccessToken || !googleEventId) {
            return;
        }

        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken || undefined,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        await calendar.events.delete({
            calendarId: 'primary',
            eventId: googleEventId,
        });
    } catch (error) {
        console.error('Failed to delete from Google Calendar:', error);
    }
};
