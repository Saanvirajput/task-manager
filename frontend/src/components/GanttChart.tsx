'use client';

import { useMemo } from 'react';
import { ArrowRight, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';

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
    TODO: { bar: 'bg-brand-400', text: 'text-brand-700', bg: 'bg-brand-50' },
    IN_PROGRESS: { bar: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
    DONE: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const PRIORITY_DOTS: Record<string, string> = {
    HIGH: 'bg-red-500',
    MEDIUM: 'bg-orange-500',
    LOW: 'bg-brand-400',
};

export default function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
    const { days, startDate, endDate } = useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        start.setDate(start.getDate() - 3);
        start.setHours(0, 0, 0, 0);

        const end = new Date(now);
        end.setDate(end.getDate() + 21);
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

    const taskIndexMap = new Map<string, number>();
    tasks.forEach((t, i) => taskIndexMap.set(t.id, i));

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-neutral-400 bg-white rounded-3xl border border-neutral-100 shadow-inner">
                <Calendar size={64} className="mb-6 opacity-10" />
                <p className="font-black text-xs uppercase tracking-widest italic">Operational Timeline Empty</p>
                <p className="text-[10px] uppercase font-bold mt-2 opacity-50">Assign directives to populate the Gantt ledger.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="px-8 py-6 border-b border-neutral-100 bg-neutral-50/30 flex items-center justify-between">
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={16} className="text-brand-500" />
                    Strategic Roadmap Matrix
                </h3>
                <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-brand-400"></span> Planned</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-indigo-500"></span> Active</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500"></span> Concluded</span>
                </div>
            </div>

            <div className="flex">
                {/* Task Names Column */}
                <div className="flex-shrink-0 w-[240px] border-r border-neutral-100 bg-white">
                    <div className="h-12 border-b border-neutral-100 bg-neutral-50/20"></div>
                    {tasks.map((task, i) => {
                        const colors = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
                        const priColor = PRIORITY_DOTS[task.priority] || PRIORITY_DOTS.MEDIUM;
                        return (
                            <div
                                key={task.id}
                                onClick={() => onTaskClick(task)}
                                className="h-14 flex items-center px-6 border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer transition-all group"
                            >
                                <div className={`w-1.5 h-6 rounded-full ${priColor} flex-shrink-0 mr-4 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                                <div className="overflow-hidden flex-1">
                                    <p className={`text-xs font-black truncate tracking-tight ${task.status === 'DONE' ? 'text-neutral-300 line-through' : 'text-neutral-800'}`}>
                                        {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${colors.text}`}>{task.status}</span>
                                        {task.recurrence && (
                                            <span className="text-[8px] font-black text-purple-500 uppercase">🔁 {task.recurrence}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Timeline Column */}
                <div className="flex-1 overflow-x-auto">
                    <div className="min-w-[1000px]">
                        {/* Day Headers */}
                        <div className="flex h-12 border-b border-neutral-100 bg-neutral-50/20">
                            {days.map((day, i) => {
                                const isToday = i === todayIndex;
                                const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                return (
                                    <div
                                        key={i}
                                        className={`flex-1 flex flex-col items-center justify-center border-r border-neutral-50/50 text-[8px] font-black uppercase tracking-tighter
                                            ${isToday ? 'bg-brand-50 text-brand-700' : isWeekend ? 'text-neutral-300 bg-neutral-50/10' : 'text-neutral-400'}`}
                                    >
                                        <span>{day.toLocaleDateString('en', { weekday: 'short' })}</span>
                                        <span className={`text-[10px] mt-0.5 ${isToday ? 'bg-brand-500 text-white w-5 h-5 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20' : ''}`}>
                                            {day.getDate()}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Task Bars Ledger */}
                        {tasks.map((task, i) => {
                            const { left, width } = getBarPosition(task);
                            const colors = STATUS_COLORS[task.status] || STATUS_COLORS.TODO;
                            return (
                                <div
                                    key={task.id}
                                    className="h-14 relative border-b border-neutral-50 group"
                                >
                                    {/* Grid Matrix */}
                                    <div className="absolute inset-0 flex">
                                        {days.map((day, di) => (
                                            <div
                                                key={di}
                                                className={`flex-1 border-r border-neutral-50/30 ${di === todayIndex ? 'bg-brand-50/10' : ''}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Today Line */}
                                    {todayIndex >= 0 && (
                                        <div
                                            className="absolute top-0 bottom-0 border-l border-brand-500/30 z-10 shadow-[0_0_15px_rgba(123,104,238,0.2)]"
                                            style={{ left: `${(todayIndex / totalDays) * 100}%` }}
                                        />
                                    )}

                                    {/* Task Pulse Bar */}
                                    <div
                                        onClick={() => onTaskClick(task)}
                                        className={`absolute top-3.5 h-7 ${colors.bar} rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] flex items-center px-3 z-20 group/bar border-b-4 border-black/10`}
                                        style={{ left: `${left}%`, width: `${width}%`, minWidth: '30px' }}
                                    >
                                        <span className="text-[9px] font-black text-white truncate uppercase tracking-widest drop-shadow-sm">
                                            {width > 12 ? task.title : ''}
                                        </span>

                                        {/* Status Glow */}
                                        <div className={`absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${task.status === 'DONE' ? 'bg-green-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : 'bg-brand-400'}`}></div>
                                    </div>

                                    {/* Dependency Connectors */}
                                    {task.dependsOn?.map(dep => {
                                        const depIdx = taskIndexMap.get(dep.id);
                                        if (depIdx === undefined) return null;
                                        return (
                                            <div
                                                key={dep.id}
                                                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 flex items-center"
                                                style={{ left: `${left}%`, marginLeft: '-12px' }}
                                            >
                                                <div className="w-3 h-0.5 bg-orange-400 rounded-full"></div>
                                                <ArrowRight size={10} className="text-orange-500 -ml-1" />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Dependency Ledger */}
            {tasks.some(t => (t.dependsOn?.length || 0) > 0) && (
                <div className="px-8 py-4 border-t border-neutral-100 bg-neutral-50/30">
                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3 italic">Chain of Dependency</p>
                    <div className="flex flex-wrap gap-3">
                        {tasks.filter(t => (t.dependsOn?.length || 0) > 0).map(t => (
                            <div key={t.id} className="flex items-center gap-2 text-[10px] text-neutral-600 bg-white px-3 py-2 rounded-xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                                <span className="font-black uppercase tracking-tight truncate max-w-[120px]">{t.title}</span>
                                <ArrowRight size={12} className="text-orange-400 flex-shrink-0" />
                                <div className="flex gap-1">
                                    {t.dependsOn!.map(d => (
                                        <span key={d.id} className="font-bold underline decoration-neutral-200">{d.title}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
