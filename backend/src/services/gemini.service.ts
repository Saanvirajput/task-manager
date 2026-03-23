import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

export const generateAIInsights = async (context: string): Promise<string> => {
    if (!GEMINI_API_KEY) return 'AI insights unavailable (no API key configured).';

    try {
        const response = await axios.post(GEMINI_URL, {
            contents: [{
                parts: [{
                    text: `You are an AI productivity coach. Analyze these tasks and give a brief, actionable 1-2 sentence insight about workload and priorities:\n\n${context}`
                }]
            }]
        });

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || 'No insights generated.';
    } catch (error) {
        console.error('Gemini AI Error:', error);
        return 'AI insights temporarily unavailable.';
    }
};
