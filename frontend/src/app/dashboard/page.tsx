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
  Filter, Calendar, ArrowUpRight, FileText, Paperclip, Check,
  BarChart3, Table2, Settings, Users, ChevronDown
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import ImportModal from '@/components/ImportModal';
import NotificationBell from '@/components/NotificationBell';
import TeamSwitcher from '@/components/TeamSwitcher';
import GanttChart from '@/components/GanttChart';
import UserSettingsModal from '@/components/UserSettingsModal';
import WorkloadAnalytics from '@/components/WorkloadAnalytics';
import confetti from 'canvas-confetti';

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconColor }: { label: string; value: any; icon: any; iconColor: string }) {
  return (
    <div
      className="p-5 rounded-xl transition-all hover:shadow-sm"
      style={{ background: '#FFFFFF', border: '1px solid #E8E8E8' }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#AEACAA' }}>
          {label}
        </span>
        <Icon size={16} style={{ color: iconColor }} />
      </div>
      <div className="text-3xl font-bold" style={{ color: '#050505', letterSpacing: '-0.02em' }}>
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
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
          colors: ['#006ADC', '#68B23A', '#E9A358', '#8B5CF6']
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
    <div className="space-y-12 max-w-[1200px] mx-auto">
      {/* Welcome Heading */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#050505', letterSpacing: '-0.02em' }}>
            Good morning, {(user as any).name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <TeamSwitcher activeTeamId={activeTeamId} onTeamChange={setActiveTeamId} />
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
            style={{
              background: '#F7F6F3',
              border: '1px solid #E8E8E8',
              color: '#050505',
              cursor: 'pointer',
            }}
          >
            <FileText size={14} />
            <span>Import</span>
          </button>
          <button
            onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white shadow-sm"
            style={{ background: '#006ADC', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={14} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {showAnalytics && activeTeamId ? (
        <WorkloadAnalytics teamId={activeTeamId} />
      ) : (
        <div className="space-y-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Tasks" value={analytics?.totalTasks ?? 0} icon={ListTodo} iconColor="#006ADC" />
            <StatCard label="Completed" value={analytics?.completedTasks ?? 0} icon={CheckCircle2} iconColor="#68B23A" />
            <StatCard label="Pending" value={analytics?.pendingTasks ?? 0} icon={Clock} iconColor="#E9A358" />
            <StatCard label="Success Rate" value={`${analytics?.completionRate ?? 0}%`} icon={ArrowUpRight} iconColor="#8B5CF6" />
          </div>

          {/* Chart Section */}
          <div className="rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8E8E8' }}>
            <h3 className="text-sm font-semibold mb-6 flex items-center gap-2" style={{ color: '#050505' }}>
              <Calendar size={15} style={{ color: '#AEACAA' }} /> Task Creation Trend (7D)
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.tasksCreatedPerDay || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8E8E8" />
                  <XAxis dataKey="date" stroke="#AEACAA" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E8E8E8', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="count" stroke="#006ADC" strokeWidth={2} dot={{ r: 3, fill: '#006ADC' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task Database View */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b" style={{ borderColor: '#E8E8E8', paddingBottom: '8px' }}>
              <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('table')} className={`text-sm font-medium pb-2 -mb-2 ${viewMode === 'table' ? 'text-[#050505] border-b-2 border-[#050505]' : 'text-[#6B6B6B] hover:text-[#050505]'}`}>
                  Table View
                </button>
                <button onClick={() => setViewMode('gantt')} className={`text-sm font-medium pb-2 -mb-2 ${viewMode === 'gantt' ? 'text-[#050505] border-b-2 border-[#050505]' : 'text-[#6B6B6B] hover:text-[#050505]'}`}>
                  Gantt View
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#AEACAA]" />
                  <input
                    type="text"
                    placeholder="Filter tasks..."
                    className="text-xs bg-[#F7F6F3] border border-transparent rounded px-7 py-1 w-40 focus:bg-white focus:border-[#006ADC] transition-all outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent text-[11px] font-medium text-[#6B6B6B] outline-none cursor-pointer">
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
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#E8E8E8' }}>
                <table className="w-full text-[13px] border-collapse bg-white">
                  <thead>
                    <tr className="bg-[#F7F6F3] text-[#AEACAA] text-left">
                      <th className="px-4 py-3 border-b border-[#E8E8E8] w-10"></th>
                      <th className="px-4 py-3 border-b border-[#E8E8E8] font-semibold uppercase tracking-wider text-[10px]">Objective</th>
                      <th className="px-4 py-3 border-b border-[#E8E8E8] font-semibold uppercase tracking-wider text-[10px]">Assignee</th>
                      <th className="px-4 py-3 border-b border-[#E8E8E8] font-semibold uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-4 py-3 border-b border-[#E8E8E8] font-semibold uppercase tracking-wider text-[10px]">Priority</th>
                      <th className="px-4 py-3 border-b border-[#E8E8E8] font-semibold uppercase tracking-wider text-[10px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E8E8]">
                    {tasks.map((task: any) => (
                      <tr key={task.id} className="group hover:bg-[#F7F6F3] transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleTaskStatus(task)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${task.status === 'DONE' ? 'bg-[#68B23A] border-[#68B23A] text-white' : 'border-[#AEACAA] group-hover:border-[#006ADC]'}`}
                          >
                            {task.status === 'DONE' && <Check size={11} strokeWidth={4} />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`font-medium ${task.status === 'DONE' ? 'text-[#AEACAA] line-through' : 'text-[#050505]'}`}>{task.title}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-[#F7F6F3] flex items-center justify-center text-[10px] font-bold border border-[#E8E8E8] text-[#050505]">
                              {(task.assignedTo?.name || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-[#6B6B6B]">{task.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${task.status === 'DONE' ? 'bg-[#D4F7E0] text-[#1A7341]' : 'bg-[#D0E8FF] text-[#0057B3]'}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${task.priority === 'HIGH' ? 'bg-[#FFE8E8] text-[#B91C1C]' : 'bg-[#F7F6F3] text-[#6B6B6B]'}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button onClick={() => { setEditingTask(task); setIsModalOpen(true); }} className="text-[#006ADC] hover:underline font-medium">Edit</button>
                          <button onClick={() => setDeletingTaskId(task.id)} className="text-[#F87171] hover:underline font-medium">Delete</button>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-2xl max-w-sm w-full p-8 border" style={{ borderColor: '#E8E8E8' }}>
            <h2 className="text-xl font-bold text-[#050505] mb-2">Confirm Delete</h2>
            <p className="text-[#6B6B6B] text-sm mb-8">This task and all associated logs will be permanently deleted.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingTaskId(null)} className="flex-1 py-2 text-[#6B6B6B] font-medium hover:bg-[#F7F6F3] rounded transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-[#F87171] text-white font-medium rounded hover:bg-red-600 transition-colors shadow-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
