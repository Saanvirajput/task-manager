import axios from 'axios';

/**
 * Sends a message to the configured Slack Incoming Webhook.
 * @param message The text message to send.
 */
export const sendSlackMessage = async (message: string) => {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('[SLACK] SLACK_WEBHOOK_URL not found in environment.');
        return;
    }

    try {
        await axios.post(webhookUrl, { text: message });
        console.log('[SLACK] Message sent successfully');
    } catch (error: any) {
        console.error('[SLACK] Error sending message:', error.message);
        // Fail silently to prevent crashing the main process
    }
};
