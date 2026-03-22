import axios from 'axios';

/**
 * Generates a productivity insight based on user task statistics.
 */
export const generateAIInsight = async (stats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
}): Promise<string> => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return stats.pending > stats.completed
                ? "You have more pending tasks than completed tasks. Try focusing on one task at a time!"
                : "Great job! You're making good progress on your tasks.";
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

        const prompt = `
            You are a productivity coach. Based on these task statistics, provide one short (1 sentence), punchy, and motivating insight.
            Stats:
            - Total Tasks: ${stats.total}
            - Completed: ${stats.completed}
            - Pending: ${stats.pending}
            - Overdue: ${stats.overdue}

            Constraint: Output ONLY the insight text.
        `;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
        };

        const response = await axios.post(url, payload);
        const insight = response.data.candidates?.[0]?.content?.parts?.[0]?.text;

        return insight?.trim() || "Keep up the momentum! Every task completed is a step forward.";
    } catch (error) {
        console.error('[AI-INSIGHT] Error:', error);
        return "Focus on your priorities today and stay productive!";
    }
};
