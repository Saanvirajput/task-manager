'use client';

import { useMemo } from 'react';
import { ArrowRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface GanttTask {
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    createdAt: string;
    recurrence?: string;
    dependsOn?: { id: string; title: string; status: string }[];
    dependedBy?: { id: string; title: string; status: string }[];
}

interface GanttChartProps {
    tasks: GanttTask[];
    onTaskClick: (task: GanttTask) => void;
}

const STATUS_COLORS: Record<string, { bar: string; text: string; bg: string }> = {
    TODO: { bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50' },
    IN_PROGRESS: { bar: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
    DONE: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const PRIORITY_DOTS: Record<string, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-amber-500',
    LOW: 'bg-blue-400',
};

export default function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
    const { days, startDate, endDate } = useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 3);
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setDate(end.getDate() + 14);
        end.setHours(23, 59, 59, 999);

        const dayList: Date[] = [];
        const d = new Date(start);
        while (d <= end) {
            dayList.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }

        return { days: dayList, startDate: start, endDate: end };
    }, []);

    const totalDays = days.length;
    const todayIndex = days.findIndex(d => d.toDateString() === new Date().toDateString());

    const getBarPosition = (task: GanttTask) => {
        const created = new Date(task.createdAt);
        const due = task.dueDate ? new Date(task.dueDate) : new Date(created.getTime() + 3 * 24 * 60 * 60 * 1000);

        const startMs = startDate.getTime();
        const endMs = endDate.getTime();
        const totalMs = endMs - startMs;

        const barStart = Math.max(0, (created.getTime() - startMs) / totalMs) * 100;
        const barEnd = Math.min(100, (due.getTime() - startMs) / totalMs) * 100;
        const barWidth = Math.max(2, barEnd - barStart);

        return { left: barStart, width: barWidth };
    };

    // Build a map of task dependencies for drawing arrows
    const taskIndexMap = new Map<string, number>();
    tasks.forEach((t, i) => taskIndexMap.set(t.id, i));

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                <Clock size={48} className="mb-4 opacity-50" />
                <p className="font-bold text-lg">No tasks to display</p>
                <p className="text-sm">Create tasks with due dates to see your timeline</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
                <h3 className="text-sm font-black text-neutral-800 uppercase tracking-wider">
                    📊 Gantt Timeline
                </h3>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-amber-400 inline-block"></span> To Do</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-blue-500 inline-block"></span> In Progress</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-emerald-500 inline-block"></span> Done</span>
                </div>
            </div>

            <div className="flex">
                {/* Task Names Column */}
                <div className="flex-shrink-0 w-[220px] border-r border-neutral-100">
                    {/* Day header spacer */}
                    <div className="h-10 border-b border-neutral-100 bg-neutral-50/50"></div>
                    {tasks.map((task, i) => {
                        const colors = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
                        const priColor = PRIORITY_DOTS[task.priority] || PRIORITY_DOTS.MEDIUM;
                        return (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className="h-12 flex items-center px-4 border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-colors group"
                            >
                                <div className={`w-2 h-2 rounded-full ${priColor} flex-shrink-0 mr-3`}></div>
                                <div className="overflow-hidden flex-1">
                                    <p className={`text-xs font-bold truncate ${task.status === 'DONE' ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[9px] font-bold uppercase ${colors.text}`}>{task.status.replace('_', ' ')}</span>
                                        {task.recurrence && (
                                            <span className="text-[9px] font-bold text-purple-500">🔁 {task.recurrence}</span>
                                        )}
                                        {(task.dependsOn?.length || 0) > 0 && (
                                            <span className="text-[9px] text-orange-500 font-bold">⛓️ {task.dependsOn!.length}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Timeline Column */}
                <div className="flex-1 overflow-x-auto">
                    <div className="min-w-[600px]">
                        {/* Day Headers */}
                        <div className="flex h-10 border-b border-neutral-100 bg-neutral-50/50">
                            {days.map((day, i) => {
                                const isToday = i === todayIndex;
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 flex flex-col items-center justify-center border-r border-neutral-50 text-[9px] font-bold
                                            ${isToday ? 'bg-indigo-50 text-indigo-700' : isWeekend ? 'text-neutral-300' : 'text-neutral-400'}`}
                                    >
                                        <span>{day.toLocaleDateString('en', { weekday: 'short' })}</span>
                                        <span className={`${isToday ? 'bg-indigo-500 text-white w-4 h-4 rounded-full flex items-center justify-center' : ''}`}>
                                            {day.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Task Bars */}
                        {tasks.map((task, i) => {
                            const { left, width } = getBarPosition(task);
                            const colors = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
                            return (
                                <div
                                    key={task.id}
                                    className="h-12 relative border-b border-neutral-50 group"
                                >
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 flex">
                                        {days.map((day, di) => (
                                            <div
                                                key={di}
                                                className={`flex-1 border-r border-neutral-50 ${di === todayIndex ? 'bg-indigo-50/30' : ''} ${(day.getDay() === 0 || day.getDay() === 6) ? 'bg-neutral-50/50' : ''}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Today vertical line */}
                                    {todayIndex >= 0 && (
                                        <div
                                            className="absolute top-0 bottom-0 border-l-2 border-dashed border-indigo-300 z-10"
                                            style={{ left: `${(todayIndex / totalDays) * 100}%` }}
                                        />
                                    )}

                                    {/* Task Bar */}
                                    <div
                                        onClick={() => onTaskClick(task)}
                                        className={`absolute top-2 h-8 ${colors.bar} rounded-md shadow-sm cursor-pointer transition-all hover:shadow-md hover:brightness-110 flex items-center px-2 z-20`}
                                        style={{ left: `${left}%`, width: `${width}%`, minWidth: '20px' }}
                                        title={`${task.title}\n${task.status} | ${task.priority}`}
                                    >
                                        <span className="text-[10px] font-bold text-white truncate">
                                            {width > 8 ? task.title : ''}
                                        </span>
                                    </div>

                                    {/* Dependency Arrow Indicators */}
                                    {task.dependsOn?.map(dep => {
                                        const depIdx = taskIndexMap.get(dep.id);
                                        if (depIdx === undefined) return null;
                                        return (
                                            <div
                                                key={dep.id}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 z-30"
                                                style={{ left: `${left}%`, marginLeft: '-8px' }}
                                            >
                                                <ArrowRight size={10} className="text-orange-500" />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Dependency Legend */}
            {tasks.some(t => (t.dependsOn?.length || 0) > 0) && (
                <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50/50">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2">Dependencies</p>
                    <div className="flex flex-wrap gap-2">
                        {tasks.filter(t => (t.dependsOn?.length || 0) > 0).map(t => (
                            <div key={t.id} className="flex items-center gap-1 text-[10px] text-neutral-500 bg-white px-2 py-1 rounded border border-neutral-100">
                                <span className="font-bold truncate max-w-[100px]">{t.title}</span>
                                <ArrowRight size={10} className="text-orange-400 flex-shrink-0" />
                                <span className="truncate max-w-[100px]">{t.dependsOn!.map(d => d.title).join(', ')}</span>
                                {t.dependsOn!.every(d => d.status === 'DONE') ? (
                                    <CheckCircle2 size={10} className="text-green-500 flex-shrink-0" />
                                ) : (
                                    <AlertCircle size={10} className="text-amber-500 flex-shrink-0" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
