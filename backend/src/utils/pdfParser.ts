export interface ExtractedTask {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const parsePdfTasks = async (dataBuffer: Buffer): Promise<ExtractedTask[]> => {
    try {
        const apiKey = "REDACTED_BY_ANTIGRAVITY";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

        const base64Pdf = dataBuffer.toString('base64');

        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: `Extract all actionable tasks from this document. For each task, provide a concise 'title', a 'description' (if present), and a 'priority' level (strictly exactly one of: LOW, MEDIUM, HIGH). Return the response strictly as a JSON array of objects without any markdown formatting, backticks, or extra text.
Example format:
[
  { "title": "Update dependencies", "description": "Upgrade React to v18", "priority": "MEDIUM" }
]`
                        },
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: base64Pdf
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API Error details:', errorText);
            throw new Error(`Gemini API responded with status ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error("No text returned from Gemini API");
        }

        // Clean up potential markdown formatting block if present
        const jsonString = responseText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
        const tasks: ExtractedTask[] = JSON.parse(jsonString);

        // Sanitize priorities
        return tasks.map(t => ({
            ...t,
            priority: ['LOW', 'MEDIUM', 'HIGH'].includes(t.priority?.toUpperCase())
                ? (t.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH')
                : 'MEDIUM'
        }));

    } catch (error) {
        console.error('Gemini Parsing Error:', error);
        throw new Error('Failed to parse PDF tasks with Gemini API');
    }
};
