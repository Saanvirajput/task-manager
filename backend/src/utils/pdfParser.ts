export interface ExtractedTask {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Parses a PDF buffer and extracts task-like structures.
 * Supports patterns: 
 * - Task: [Title]
 * - Description: [Text]
 * - Priority: [High/Medium/Low]
 * - Bullet points: 1. [Title]
 */
export const parsePdfTasks = async (dataBuffer: Buffer): Promise<ExtractedTask[]> => {
    try {
        // Direct buffer processing: Extracts text streams from simple uncompressed PDFs
        // This bypasses `pdf-parse` and its Node v18 incompatibilities.
        let text = dataBuffer.toString('utf8');

        // Remove common PDF syntax noise to get the raw textual payload
        text = text.replace(/%PDF-\d\.\d/g, '')
            .replace(/obj|endobj|stream|endstream|xref|trailer|startxref|%%EOF/g, '')
            .replace(/<<.*?>>/gs, '')
            .replace(/\/[a-zA-Z0-9]+/g, '');

        // Extract text inside PDF literal strings: (Text Content)
        const strings = text.match(/\((.*?)\)/g);
        if (strings) {
            text = strings.map(s => s.replace(/^\(/, '').replace(/\)$/, '')).join('\n');
        }

        const tasks: ExtractedTask[] = [];
        const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        let currentTask: Partial<ExtractedTask> | null = null;

        for (const line of lines) {
            const taskMatch = line.match(/^(?:Task|Name):\s*(.*)/i);
            if (taskMatch) {
                if (currentTask?.title) tasks.push(currentTask as ExtractedTask);
                currentTask = { title: taskMatch[1].trim(), priority: 'MEDIUM', description: '' };
                continue;
            }
            const priorityMatch = line.match(/Priority:\s*(High|Medium|Low|Med)/i);
            if (priorityMatch && currentTask) {
                const p = priorityMatch[1].toUpperCase();
                currentTask.priority = (p === 'MED' ? 'MEDIUM' : p) as 'LOW' | 'MEDIUM' | 'HIGH';
                continue;
            }
            const descMatch = line.match(/Description:\s*(.*)/i);
            if (descMatch && currentTask) {
                currentTask.description = descMatch[1].trim();
                continue;
            }
            const bulletMatch = line.match(/^[\d•*-]\s*(.*)/);
            if (bulletMatch) {
                if (currentTask?.title) tasks.push(currentTask as ExtractedTask);
                const inlinePriority = bulletMatch[1].match(/\((High|Medium|Low|Med)\)/i);
                currentTask = {
                    title: bulletMatch[1].replace(/\((High|Medium|Low|Med)\)/i, '').trim(),
                    priority: inlinePriority ? ((inlinePriority[1].toUpperCase() === 'MED' ? 'MEDIUM' : inlinePriority[1].toUpperCase()) as any) : 'MEDIUM',
                    description: ''
                };
                continue;
            }
            if (currentTask && !line.match(/^(?:Task|Priority|Description|Name):/i)) {
                currentTask.description += (currentTask.description ? ' ' : '') + line;
            }
        }
        if (currentTask?.title) tasks.push(currentTask as ExtractedTask);
        return tasks;
    } catch (error) {
        console.error('Buffer Parsing Error:', error);
        throw new Error('Failed to parse PDF tasks');
    }
};
