'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    LayoutDashboard, ListTodo, CheckCircle2, Clock,
    Search, Plus, LogOut, ChevronLeft, ChevronRight,
    Filter, Calendar, ArrowUpRight, FileText, Paperclip, Check, BarChart3, Table2, Settings, Users
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import ImportModal from '@/components/ImportModal';
import NotificationBell from '@/components/NotificationBell';
import TeamSwitcher from '@/components/TeamSwitcher';
import GanttChart from '@/components/GanttChart';
import UserSettingsModal from '@/components/UserSettingsModal';
import WorkloadAnalytics from '@/components/WorkloadAnalytics';
import confetti from 'canvas-confetti';


export default function DashboardPage() {
    const { user, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    const [tasks, setTasks] = useState([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [priority, setPriority] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
    const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
    const [activeTeam, setActiveTeam] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
    const [showAnalytics, setShowAnalytics] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [tasksRes, analyticsRes] = await Promise.all([
                api.get('/tasks', {
                    params: {
                        search,
                        status,
                        priority,
                        page,
                        limit: 10,
                        teamId: activeTeamId || undefined
                    }
                }),
                api.get('/analytics/overview')
            ]);
            setTasks(tasksRes.data.tasks);
            setTotalPages(tasksRes.data.pagination.totalPages);
            setAnalytics(analyticsRes.data);

            if (activeTeamId) {
                const teamRes = await api.get(`/teams/${activeTeamId}`);
                setActiveTeam(teamRes.data);
            }
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    }, [search, status, priority, page, activeTeamId]);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        if (user) fetchDashboardData();
    }, [user, authLoading, fetchDashboardData, router]);

    const handleDelete = async () => {
        if (deletingTaskId) {
            await api.delete(`/tasks/${deletingTaskId}`);
            setDeletingTaskId(null);
            fetchDashboardData();
        }
    };

    const toggleTaskStatus = async (task: any) => {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';

        setTasks((prev: any) => prev.map((t: any) =>
            t.id === task.id ? { ...t, status: newStatus } : t
        ));

        try {
            if (newStatus === 'DONE') {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#7b68ee', '#22c55e', '#3b82f6', '#f59e0b']
                });
            }

            await api.put(`/tasks/${task.id}`, {
                ...task,
                status: newStatus
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to update task status', error);
            setTasks((prev: any) => prev.map((t: any) =>
                t.id === task.id ? { ...t, status: task.status } : t
            ));
        }
    };

    if (authLoading || !user) return null;

    return (
        <>
            <div className="space-y-12">
                {/* Header */}
                <header className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Dashboard</h1>
                        <p className="text-[var(--secondary-foreground)] text-sm mt-1">Manage your team and track your productivity window.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="notion-button flex items-center gap-2"
                        >
                            <FileText size={16} />
                            <span>Import</span>
                        </button>
                        <button
                            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--foreground)] text-[var(--background)] rounded font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            <Plus size={16} />
                            <span>New Task</span>
                        </button>
                    </div>
                </header>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Tasks', val: analytics?.totalTasks || 0, icon: ListTodo },
                        { label: 'Completed', val: analytics?.completedTasks || 0, icon: CheckCircle2 },
                        { label: 'Pending', val: analytics?.pendingTasks || 0, icon: Clock },
                        { label: 'Success Rate', val: `${analytics?.completionRate || 0}%`, icon: ArrowUpRight }
                    ].map((card, i) => (
                        <div key={i} className="notion-card p-4 flex flex-col justify-between h-24">
                            <div className="flex items-center gap-2 text-[var(--secondary-foreground)]">
                                <card.icon size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
                            </div>
                            <div className="text-2xl font-semibold text-[var(--foreground)]">{card.val}</div>
                        </div>
                    ))}
                </div>

                {showAnalytics && activeTeamId ? (
                    <WorkloadAnalytics teamId={activeTeamId} />
                ) : (
                    <div className="space-y-10">
                        {/* Analytics Chart */}
                        <div className="notion-card p-6">
                            <h3 className="font-semibold text-sm text-[var(--foreground)] mb-6 flex items-center gap-2">
                                <Calendar size={16} /> Performance Analytics (7D)
                            </h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics?.tasksCreatedPerDay || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="date" stroke="var(--secondary-foreground)" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                                        <YAxis hide />
                                        <Tooltip contentStyle={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '12px' }} />
                                        <Line type="monotone" dataKey="count" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3, fill: 'var(--brand)' }} activeDot={{ r: 5 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Task Database View */}
                        <section className="space-y-4">
                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setViewMode('table')} className={`text-sm font-medium transition-colors ${viewMode === 'table' ? 'text-[var(--foreground)] border-b-2 border-[var(--foreground)]' : 'text-[var(--secondary-foreground)] hover:text-[var(--foreground)]'}`}>
                                        Grid View
                                    </button>
                                    <button onClick={() => setViewMode('gantt')} className={`text-sm font-medium transition-colors ${viewMode === 'gantt' ? 'text-[var(--foreground)] border-b-2 border-[var(--foreground)]' : 'text-[var(--secondary-foreground)] hover:text-[var(--foreground)]'}`}>
                                        Gantt View
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative group">
                                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--secondary-foreground)]" />
                                        <input
                                            type="text"
                                            placeholder="Filter tasks..."
                                            className="text-xs bg-[var(--hover)] border border-transparent rounded px-7 py-1 w-40 focus:bg-[var(--background)] focus:border-[var(--brand)] transition-all outline-none"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="notion-button text-[11px] bg-transparent">
                                        <option value="">Status</option>
                                        <option value="TODO">To Do</option>
                                        <option value="IN_PROGRESS">Progress</option>
                                        <option value="DONE">Done</option>
                                    </select>
                                </div>
                            </div>

                            {viewMode === 'gantt' ? (
                                <GanttChart tasks={tasks} onTaskClick={(t: any) => { setEditingTask(t); setIsModalOpen(true); }} />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-[13px] border-collapse">
                                        <thead>
                                            <tr className="text-[var(--secondary-foreground)] font-normal text-left">
                                                <th className="px-2 py-2 border-b border-[var(--border)] w-8"></th>
                                                <th className="px-2 py-2 border-b border-[var(--border)] font-normal">Objective</th>
                                                <th className="px-2 py-2 border-b border-[var(--border)] font-normal">Assignee</th>
                                                <th className="px-2 py-2 border-b border-[var(--border)] font-normal">Status</th>
                                                <th className="px-2 py-2 border-b border-[var(--border)] font-normal">Priority</th>
                                                <th className="px-2 py-2 border-b border-[var(--border)] font-normal text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[var(--border)]">
                                            {tasks.map((task: any) => (
                                                <tr key={task.id} className="group hover:bg-[var(--hover)] transition-colors">
                                                    <td className="px-2 py-3">
                                                        <button
                                                            onClick={() => toggleTaskStatus(task)}
                                                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${task.status === 'DONE' ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--secondary-foreground)]/50 group-hover:border-[var(--brand)]'}`}
                                                        >
                                                            {task.status === 'DONE' && <Check size={10} strokeWidth={4} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <div className={`font-medium ${task.status === 'DONE' ? 'text-[var(--secondary-foreground)] line-through' : 'text-[var(--foreground)]'}`}>{task.title}</div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded bg-[var(--hover)] flex items-center justify-center text-[10px] font-medium border border-[var(--border)]">
                                                                {(task.assignedTo?.name || '?')[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-[var(--secondary-foreground)]">{task.assignedTo?.name || 'Unassigned'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${task.status === 'DONE' ? 'bg-green-100/50 text-green-700' : 'bg-blue-100/50 text-blue-700'}`}>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${task.priority === 'HIGH' ? 'bg-red-100/50 text-red-700' : 'bg-[var(--hover)] text-[var(--secondary-foreground)]'}`}>
                                                            {task.priority}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-3 text-right">
                                                        <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="notion-button text-[11px]">Edit</button>
                                                        <button onClick={() => setDeletingTaskId(task.id)} className="notion-button text-[11px] text-red-400">Delete</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
                onSuccess={fetchDashboardData}
                task={editingTask}
                availableTasks={tasks}
                teamId={activeTeamId}
                teamMembers={activeTeam?.members || []}
            />

            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={fetchDashboardData} teamId={activeTeamId} />
            <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setIsUserSettingsOpen(false)} />

            {deletingTaskId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded shadow-2xl max-w-sm w-full p-8 border border-[var(--border)]">
                        <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Confirm Delete</h2>
                        <p className="text-[var(--secondary-foreground)] text-sm mb-8">This task and all associated logs will be permanently deleted.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeletingTaskId(null)} className="notion-button flex-1 py-2">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors shadow">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
