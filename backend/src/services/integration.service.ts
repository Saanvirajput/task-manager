import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendSlackNotification = async (workspaceId: string, message: string) => {
    try {
        const integrations = await (prisma as any).integration.findMany({
            where: {
                workspaceId,
                type: 'SLACK'
            }
        });

        for (const integration of integrations) {
            try {
                await axios.post(integration.webhookUrl, {
                    text: message
                });
                console.log(`Slack notification sent for workspace ${workspaceId}`);
            } catch (error) {
                console.error(`Failed to send Slack notification for integration ${integration.id}:`, error);
            }
        }
    } catch (error) {
        console.error('Slack notification service error:', error);
    }
};
