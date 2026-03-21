export interface ExtractedTask {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ScheduleDay {
    day: number;
    tasks: string[];
}

export interface ExtractedPlan {
    tasks: ExtractedTask[];
    schedule: ScheduleDay[];
}

export const parsePdfTasks = async (dataBuffer: Buffer): Promise<ExtractedPlan> => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY environment variable is not set');
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

        const base64Pdf = dataBuffer.toString('base64');

        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: `You are an intelligent task planning assistant.

Your job is to analyze the given content (extracted from a PDF such as notes, syllabus, or project document) and generate a structured, actionable task plan.

INSTRUCTIONS:
1. Extract meaningful, actionable tasks from the content.
2. Break large concepts into smaller, executable tasks.
3. Assign each task:
   * title (short and clear)
   * description (optional but helpful)
   * priority (LOW, MEDIUM, HIGH based on importance/urgency)
4. Do NOT generate vague tasks. Be specific and practical.
5. Create a daily execution plan:
   * Distribute tasks over days logically
   * Keep workload balanced
   * Assume user can complete 3–5 tasks per day
6. Keep tasks realistic for a student or developer.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "LOW | MEDIUM | HIGH"
    }
  ],
  "schedule": [
    {
      "day": 1,
      "tasks": ["task title 1", "task title 2"]
    }
  ]
}`
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

        const data: any = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error("No text returned from Gemini API");
        }

        // Clean up potential markdown formatting block if present
        const jsonString = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const plan = JSON.parse(jsonString) as ExtractedPlan;

        if (!plan.tasks) plan.tasks = [];
        if (!plan.schedule) plan.schedule = [];

        // Sanitize priorities
        plan.tasks = plan.tasks.map(t => ({
            ...t,
            priority: ['LOW', 'MEDIUM', 'HIGH'].includes(t.priority?.toUpperCase() || '')
                ? (t.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH')
                : 'MEDIUM'
        }));

        return plan;
    } catch (error) {
        console.error('Gemini Parsing Error:', error);
        throw new Error('Failed to parse PDF tasks with Gemini API');
    }
};
