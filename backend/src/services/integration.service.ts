import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

export const sendSlackNotification = async (teamId: string, message: string) => {
    try {
        const integration = await (prisma as any).integration.findFirst({
            where: { teamId, type: 'SLACK' }
        });

        if (!integration || !integration.webhookUrl) return;

        await axios.post(integration.webhookUrl, {
            text: message
        });
    } catch (error) {
        console.error('Slack Notification Error:', error);
    }
};
