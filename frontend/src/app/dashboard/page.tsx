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
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-neutral-100 border-r border-neutral-200 p-6 hidden md:block overflow-y-auto">
                <div className="flex items-center gap-2 mb-8 uppercase tracking-widest text-indigo-600 font-black">
                    <ListTodo size={22} />
                    <span className="text-xl">TaskFlow</span>
                </div>

                <TeamSwitcher
                    activeTeamId={activeTeamId}
                    onTeamChange={setActiveTeamId}
                />

                <nav className="space-y-2 mt-8">
                    <button
                        onClick={() => setShowAnalytics(false)}
                        className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all ${!showAnalytics ? 'bg-white shadow-sm ring-1 ring-neutral-200 text-brand-600 font-bold' : 'text-neutral-500 hover:bg-neutral-200 font-semibold'}`}
                    >
                        <LayoutDashboard size={20} /> My Dashboard
                    </button>
                    {activeTeamId && (
                        <button
                            onClick={() => setShowAnalytics(true)}
                            className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all ${showAnalytics ? 'bg-white shadow-sm ring-1 ring-neutral-200 text-brand-600 font-bold' : 'text-neutral-500 hover:bg-neutral-200 font-semibold'}`}
                        >
                            <BarChart3 size={20} /> Team Insights
                        </button>
                    )}
                    <button onClick={() => setIsUserSettingsOpen(true)} className="flex items-center gap-3 w-full p-2.5 rounded-xl font-semibold text-neutral-500 hover:bg-neutral-200 transition-all">
                        <Settings size={20} /> Security & MFA
                    </button>
                    <button onClick={logout} className="flex items-center gap-3 w-full p-2.5 rounded-xl font-semibold text-neutral-500 hover:bg-red-50 hover:text-red-500 transition-all">
                        <LogOut size={20} /> Sign Out
                    </button>
                </nav>
            </aside>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900">Welcome, {user.name}</h1>
                        <p className="text-neutral-500 font-medium text-sm">Enterprise Dashboard & Team Intelligence</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <NotificationBell />
                        <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white font-bold rounded-xl shadow-xl hover:bg-black transition-all text-sm">
                            <FileText size={18} /> Import PDF
                        </button>
                        <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-bold rounded-xl shadow-xl hover:bg-brand-600 transition-all text-sm">
                            <Plus size={18} /> New Task
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Tasks', val: analytics?.totalTasks || 0, icon: ListTodo, color: 'text-blue-500' },
                        { label: 'Completed', val: analytics?.completedTasks || 0, icon: CheckCircle2, color: 'text-green-500' },
                        { label: 'Pending', val: analytics?.pendingTasks || 0, icon: Clock, color: 'text-orange-500' },
                        { label: 'Success Rate', val: `${analytics?.completionRate || 0}%`, icon: ArrowUpRight, color: 'text-brand-500' }
                    ].map((card, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between mb-2">
                                <span className="text-neutral-400 font-bold text-[10px] uppercase tracking-widest">{card.label}</span>
                                <card.icon className={card.color} size={18} />
                            </div>
                            <div className="text-3xl font-black text-neutral-800">{card.val}</div>
                        </div>
                    ))}
                </div>

                {showAnalytics && activeTeamId ? (
                    <WorkloadAnalytics teamId={activeTeamId} />
                ) : (
                    <>
                        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm mb-8">
                            <h3 className="font-bold text-neutral-800 mb-6 flex items-center gap-2">
                                <Calendar size={18} /> Performance Analytics (7D Window)
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics?.tasksCreatedPerDay || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="date" stroke="#AEACA8" fontSize={10} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                                        <YAxis stroke="#AEACA8" fontSize={10} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        <Line type="smooth" dataKey="count" stroke="#7b68ee" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#7b68ee', strokeWidth: 0 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center bg-white border border-neutral-200 rounded-xl p-1 shadow-sm">
                                <button onClick={() => setViewMode('table')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                                    <Table2 size={14} /> Grid View
                                </button>
                                <button onClick={() => setViewMode('gantt')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'gantt' ? 'bg-black text-white' : 'text-neutral-500 hover:bg-neutral-50'}`}>
                                    <BarChart3 size={14} /> Gantt View
                                </button>
                            </div>
                        </div>

                        {viewMode === 'gantt' ? (
                            <GanttChart tasks={tasks} onTaskClick={(t: any) => { setEditingTask(t); setIsModalOpen(true); }} />
                        ) : (
                            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden mb-12">
                                <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-wrap gap-4 items-center justify-between">
                                    <div className="relative flex-1 min-w-[300px]">
                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Universal Task Search..."
                                            className="w-full pl-12 pr-4 py-3 bg-white ring-1 ring-neutral-200 focus:ring-2 focus:ring-brand-500 outline-none rounded-xl text-sm transition-all"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-xs font-black p-3 rounded-xl border-neutral-200 uppercase tracking-tighter">
                                            <option value="">Status</option>
                                            <option value="TODO">To Do</option>
                                            <option value="IN_PROGRESS">Progress</option>
                                            <option value="DONE">Done</option>
                                        </select>
                                        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="text-xs font-black p-3 rounded-xl border-neutral-200 uppercase tracking-tighter">
                                            <option value="">Priority</option>
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                        </select>
                                    </div>
                                </div>

                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-neutral-50/50 text-neutral-400 font-black uppercase text-[10px] tracking-widest border-b border-neutral-200">
                                            <th className="px-6 py-5 w-12 text-center"></th>
                                            <th className="px-6 py-5">Objective</th>
                                            <th className="px-6 py-5">Assignee</th>
                                            <th className="px-6 py-5">Status</th>
                                            <th className="px-6 py-5">Priority</th>
                                            <th className="px-6 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {tasks.map((task: any) => (
                                            <tr key={task.id} className="group hover:bg-neutral-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => toggleTaskStatus(task)}
                                                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${task.status === 'DONE' ? 'bg-green-500 border-green-500 text-white' : 'border-neutral-200 group-hover:border-brand-500'}`}
                                                    >
                                                        {task.status === 'DONE' && <Check size={12} strokeWidth={4} />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className={`text-sm font-bold ${task.status === 'DONE' ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>{task.title}</div>
                                                    <div className="text-[10px] text-neutral-400 uppercase font-black">{task.visibility} • {task.cveId || 'SYSTEM'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center text-[10px] font-bold text-brand-600">
                                                            {(task.assignedTo?.name || '?')[0].toUpperCase()}
                                                        </div>
                                                        <span className="text-xs font-semibold text-neutral-600">{task.assignedTo?.name || 'Unassigned'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${task.status === 'DONE' ? 'bg-green-50 text-green-600' : 'bg-brand-50 text-brand-600'}`}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600' : 'bg-neutral-50 text-neutral-600'}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="text-brand-500 font-bold text-xs hover:underline mr-3">Edit</button>
                                                    <button onClick={() => setDeletingTaskId(task.id)} className="text-red-400 font-bold text-xs hover:underline">Revoke</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </main>

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
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 border border-neutral-200">
                        <h2 className="text-xl font-black text-neutral-900 mb-2">Confirm Revoke</h2>
                        <p className="text-neutral-500 text-sm mb-8 font-medium">This task and all associated child logs will be purged from the enterprise ledger.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setDeletingTaskId(null)} className="flex-1 py-3 bg-neutral-100 text-neutral-600 font-bold rounded-xl">Hold</button>
                            <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg ring-4 ring-red-100">Purge</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
