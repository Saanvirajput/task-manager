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
    Filter, Calendar, ArrowUpRight, FileText, Paperclip, Check
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import ImportModal from '@/components/ImportModal';
import NotificationBell from '@/components/NotificationBell';

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
    const [editingTask, setEditingTask] = useState(null);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        try {
            const [tasksRes, analyticsRes] = await Promise.all([
                api.get('/tasks', { params: { search, status, priority, page, limit: 10 } }),
                api.get('/analytics/overview')
            ]);
            setTasks(tasksRes.data.tasks);
            setTotalPages(tasksRes.data.pagination.totalPages);
            setAnalytics(analyticsRes.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        }
    }, [search, status, priority, page]);

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

        // Optimistic update
        setTasks((prev: any) => prev.map((t: any) =>
            t.id === task.id ? { ...t, status: newStatus } : t
        ));

        try {
            await api.put(`/tasks/${task.id}`, {
                ...task,
                status: newStatus
            });
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to update task status', error);
            // Revert on error
            setTasks((prev: any) => prev.map((t: any) =>
                t.id === task.id ? { ...t, status: task.status } : t
            ));
        }
    };

    if (authLoading || !user) return null;

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar Placeholder (simplified for this task) */}
            <aside className="w-64 bg-neutral-100 border-r border-neutral-200 p-6 hidden md:block">
                <div className="flex items-center gap-2 mb-10">
                    <div className="w-8 h-8 bg-brand-500 rounded-md flex items-center justify-center">
                        <CheckCircle2 className="text-white" size={20} />
                    </div>
                    <span className="font-bold text-neutral-800 text-lg">TaskFlow</span>
                </div>
                <nav className="space-y-2">
                    <button className="flex items-center gap-3 w-full p-2 rounded-md bg-white border border-neutral-200 text-brand-600 font-bold shadow-sm">
                        <LayoutDashboard size={20} /> Dashboard
                    </button>
                    <button onClick={logout} className="flex items-center gap-3 w-full p-2 rounded-md font-bold text-neutral-600 hover:bg-neutral-200 transition-colors mt-auto">
                        <LogOut size={20} /> Logout
                    </button>
                </nav>
            </aside>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold font-neutral-800">Welcome, {user.name}</h1>
                        <p className="text-neutral-500 font-medium text-sm">Here's what's happening today.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <NotificationBell />
                        <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg shadow-lg hover:bg-black transition-all">
                            <FileText size={20} /> Import PDF
                        </button>
                        <button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white font-bold rounded-lg shadow-lg hover:bg-brand-600 transition-all">
                            <Plus size={20} /> New Task
                        </button>
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-neutral-600 font-bold text-sm uppercase tracking-wider">Total Tasks</span>
                            <ListTodo className="text-blue-500" size={20} />
                        </div>
                        <div className="text-3xl font-bold text-neutral-800">{analytics?.totalTasks || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-neutral-600 font-bold text-sm uppercase tracking-wider">Completed</span>
                            <CheckCircle2 className="text-green-500" size={20} />
                        </div>
                        <div className="text-3xl font-bold text-neutral-800">{analytics?.completedTasks || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-neutral-600 font-bold text-sm uppercase tracking-wider">Pending</span>
                            <Clock className="text-orange-500" size={20} />
                        </div>
                        <div className="text-3xl font-bold text-neutral-800">{analytics?.pendingTasks || 0}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <div className="flex justify-between mb-2">
                            <span className="text-neutral-600 font-bold text-sm uppercase tracking-wider">Completion Rate</span>
                            <ArrowUpRight className="text-brand-500" size={20} />
                        </div>
                        <div className="text-3xl font-bold text-neutral-800">{analytics?.completionRate || 0}%</div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm mb-8">
                    <h3 className="font-bold text-neutral-800 mb-6 flex items-center gap-2">
                        <Calendar size={18} /> Task Creation Trend (Last 7 Days)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics?.tasksCreatedPerDay || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E2E0" />
                                <XAxis dataKey="date" stroke="#AEACA8" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                                <YAxis stroke="#AEACA8" fontSize={12} />
                                <Tooltip />
                                <Line type="monotone" dataKey="count" stroke="#7b68ee" strokeWidth={3} dot={{ r: 4, fill: '#7b68ee' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Task Table Section */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex flex-wrap gap-4 items-center justify-between">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                className="w-full pl-10 pr-4 py-2"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="text-sm font-medium">
                                <option value="">All Status</option>
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="text-sm font-medium">
                                <option value="">All Priority</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase text-xs tracking-wider border-b border-neutral-200">
                                <th className="px-6 py-4 w-12 text-center">Done</th>
                                <th className="px-6 py-4">Title</th>
                                <th className="px-6 py-4">CVE / Ref</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Priority</th>
                                <th className="px-6 py-4">Due Date</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {tasks.map((task: any) => (
                                <tr key={task.id} className="hover:bg-neutral-50/50 transition-colors">
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => toggleTaskStatus(task)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mx-auto transition-all ${task.status === 'DONE'
                                                ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                                : 'border-neutral-300 hover:border-brand-500 bg-white hover:bg-neutral-50'
                                                }`}
                                            title={task.status === 'DONE' ? 'Mark as Todo' : 'Mark as Done'}
                                        >
                                            {task.status === 'DONE' && <Check size={14} strokeWidth={4} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-neutral-800 flex items-center gap-2">
                                            {task.title}
                                            {task.attachmentUrl && (
                                                <a
                                                    href={`${(process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '')}${task.attachmentUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-brand-500 hover:text-brand-600"
                                                    title={task.attachmentName}
                                                >
                                                    <Paperclip size={14} />
                                                </a>
                                            )}
                                        </div>
                                        {task.description && <div className="text-neutral-400 text-xs truncate max-w-[200px]">{task.description}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        {task.cveId ? (
                                            <span className="flex items-center gap-1 text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-1 rounded w-fit">
                                                <FileText size={12} /> {task.cveId}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-300 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${task.status === 'DONE' ? 'bg-green-100 text-green-700' :
                                            task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-neutral-100 text-neutral-700'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {task.dueDate ? (
                                            <span className={`text-xs font-medium ${new Date(task.dueDate) < new Date() && task.status !== 'DONE'
                                                ? 'text-red-600 font-bold'
                                                : 'text-neutral-500'
                                                }`}>
                                                {new Date(task.dueDate).toLocaleDateString()}
                                                {new Date(task.dueDate) < new Date() && task.status !== 'DONE' && (
                                                    <span className="ml-1 text-red-500">⚠️</span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-300 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-neutral-500 text-sm">
                                        {new Date(task.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="text-brand-500 font-bold text-sm hover:underline">Edit</button>
                                        <button onClick={() => setDeletingTaskId(task.id)} className="text-red-500 font-bold text-sm hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {tasks.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-neutral-500 font-medium">No tasks found. Try adjusting your filters or search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
                        <span className="text-sm text-neutral-500 font-medium">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-1 border border-neutral-200 rounded-md disabled:opacity-50">
                                <ChevronLeft size={20} />
                            </button>
                            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-1 border border-neutral-200 rounded-md disabled:opacity-50">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchDashboardData}
                task={editingTask}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={fetchDashboardData}
            />

            {/* Custom Delete Confirmation Modal */}
            {deletingTaskId && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-200">
                        <h2 className="text-lg font-bold text-neutral-800 mb-2">Delete Task?</h2>
                        <p className="text-neutral-500 text-sm mb-6">Are you sure you want to remove this task? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeletingTaskId(null)} className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold rounded-lg transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-lg transition-all">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
