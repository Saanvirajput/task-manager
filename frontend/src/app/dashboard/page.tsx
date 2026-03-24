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
  Calendar, ArrowUpRight, FileText, Paperclip, Check,
  BarChart3, Table2, Settings, ChevronDown
} from 'lucide-react';
import TaskModal from '@/components/TaskModal';
import ImportModal from '@/components/ImportModal';
import NotificationBell from '@/components/NotificationBell';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';
import GanttChart from '@/components/GanttChart';
import UserSettingsModal from '@/components/UserSettingsModal';
import WorkloadAnalytics from '@/components/WorkloadAnalytics';
import confetti from 'canvas-confetti';

// ─── Notion Logo ─────────────────────────────────────────────────────────────
function NotionLogo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="black" />
      <path d="M8.5 8.5H14.5L22 20.5V11.5H24V23.5H18L10.5 11.5V20.5H8.5V8.5Z" fill="white" />
    </svg>
  );
}

// ─── Sidebar nav item ─────────────────────────────────────────────────────────
function NavItem({
  icon: Icon, label, active, onClick,
}: { icon: any; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors"
      style={{
        color: active ? '#050505' : '#6B6B6B',
        background: active ? '#EBEBEA' : 'transparent',
        fontWeight: active ? 600 : 400,
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F7F6F3'; }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <Icon size={15} />
      <span>{label}</span>
    </button>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, iconColor }: { label: string; value: any; icon: any; iconColor: string }) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: '#FFFFFF', border: '1px solid #E8E8E8' }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#AEACAA' }}>
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

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    DONE:        { bg: '#D4F7E0', color: '#1A7341', label: 'Done' },
    IN_PROGRESS: { bg: '#D0E8FF', color: '#0057B3', label: 'In Progress' },
    TODO:        { bg: '#F7F6F3', color: '#6B6B6B', label: 'To Do' },
  };
  const s = styles[status] || styles.TODO;
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    HIGH:   { bg: '#FFE8E8', color: '#B91C1C' },
    MEDIUM: { bg: '#FFF3D0', color: '#92400E' },
    LOW:    { bg: '#F7F6F3', color: '#6B6B6B' },
  };
  const s = styles[priority] || styles.LOW;
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
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
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'gantt'>('table');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [tasksRes, analyticsRes] = await Promise.all([
        api.get('/tasks', {
          params: { search, status, priority, page, limit: 10, workspaceId: activeWorkspaceId || undefined },
        }),
        api.get('/analytics/overview'),
      ]);
      setTasks(tasksRes.data.tasks);
      setTotalPages(tasksRes.data.pagination.totalPages);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    }
  }, [search, status, priority, page, activeWorkspaceId]);

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
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: ['#006ADC', '#68B23A', '#E9A358'] });
      }
      await api.put(`/tasks/${task.id}`, { ...task, status: newStatus });
      fetchDashboardData();
    } catch {
      setTasks((prev: any) => prev.map((t: any) =>
        t.id === task.id ? { ...t, status: task.status } : t
      ));
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen flex" style={{ background: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className="w-60 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0"
        style={{ background: '#F7F6F3', borderRight: '1px solid #E8E8E8' }}
      >
        {/* Workspace header */}
        <div
          className="flex items-center gap-2 px-3 py-3 mx-2 mt-2 rounded-md cursor-pointer"
          style={{ transition: 'background 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#EBEBEA')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <NotionLogo size={20} />
          <span className="text-sm font-semibold flex-1 truncate" style={{ color: '#050505' }}>
            {(user as any).name?.split(' ')[0] ?? 'My'}&apos;s Workspace
          </span>
          <ChevronDown size={14} style={{ color: '#AEACAA' }} />
        </div>

        {/* Workspace switcher */}
        <div className="px-3 pt-1">
          <WorkspaceSwitcher
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceChange={setActiveWorkspaceId}
          />
        </div>

        {/* Navigation */}
        <nav className="px-2 pt-4 flex-1 space-y-0.5">
          <div className="px-2 pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#AEACAA' }}>
              Workspace
            </span>
          </div>
          <NavItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={!showAnalytics}
            onClick={() => setShowAnalytics(false)}
          />
          {activeWorkspaceId && (
            <NavItem
              icon={BarChart3}
              label="Team Insights"
              active={showAnalytics}
              onClick={() => setShowAnalytics(true)}
            />
          )}
        </nav>

        {/* Bottom nav */}
        <div className="px-2 pb-3 space-y-0.5 border-t pt-3" style={{ borderColor: '#E8E8E8' }}>
          <NavItem icon={Settings} label="Settings & MFA" onClick={() => setIsUserSettingsOpen(true)} />
          <NavItem icon={LogOut} label="Log out" onClick={logout} />
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">

        {/* Top header bar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-8 py-3 border-b"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderColor: '#E8E8E8' }}
        >
          <div>
            <h1 className="text-base font-semibold" style={{ color: '#050505' }}>
              {showAnalytics ? 'Team Insights' : 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium"
              style={{
                background: '#F7F6F3',
                border: '1px solid #E8E8E8',
                color: '#050505',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#EBEBEA')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#F7F6F3')}
            >
              <FileText size={14} />
              Import PDF
            </button>
            <button
              onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white"
              style={{ background: '#006ADC', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0057B3')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#006ADC')}
            >
              <Plus size={14} />
              New Task
            </button>
          </div>
        </div>

        {/* Page body */}
        <div className="px-8 py-6 max-w-[1200px]">

          {/* Welcome heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#050505', letterSpacing: '-0.02em' }}>
              Good morning, {(user as any).name?.split(' ')[0]} 👋
            </h2>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>
              Here&apos;s what&apos;s happening in your workspace today.
            </p>
          </div>

          {/* Analytics view */}
          {showAnalytics && activeWorkspaceId ? (
            <WorkloadAnalytics workspaceId={activeWorkspaceId} />
          ) : (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Tasks" value={analytics?.totalTasks ?? 0} icon={ListTodo} iconColor="#006ADC" />
                <StatCard label="Completed" value={analytics?.completedTasks ?? 0} icon={CheckCircle2} iconColor="#68B23A" />
                <StatCard label="Pending" value={analytics?.pendingTasks ?? 0} icon={Clock} iconColor="#E9A358" />
                <StatCard label="Completion Rate" value={`${analytics?.completionRate ?? 0}%`} icon={ArrowUpRight} iconColor="#8B5CF6" />
              </div>

              {/* Chart */}
              <div
                className="rounded-xl mb-8 p-6"
                style={{ background: '#FFFFFF', border: '1px solid #E8E8E8' }}
              >
                <h3 className="text-sm font-semibold mb-5 flex items-center gap-2" style={{ color: '#050505' }}>
                  <Calendar size={15} style={{ color: '#AEACAA' }} />
                  Task creation trend — last 7 days
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.tasksCreatedPerDay || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EFED" />
                      <XAxis
                        dataKey="date"
                        stroke="#AEACAA"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis stroke="#AEACAA" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#FFFFFF',
                          border: '1px solid #E8E8E8',
                          borderRadius: '8px',
                          fontSize: '12px',
                          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#006ADC"
                        strokeWidth={2}
                        dot={{ r: 3, fill: '#006ADC', strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: '#006ADC' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* View toggle + task table */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: '#050505' }}>Tasks</h3>
                <div
                  className="flex items-center gap-0.5 rounded-lg p-0.5"
                  style={{ background: '#F7F6F3', border: '1px solid #E8E8E8' }}
                >
                  {['table', 'gantt'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m as 'table' | 'gantt')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: viewMode === m ? '#FFFFFF' : 'transparent',
                        color: viewMode === m ? '#050505' : '#6B6B6B',
                        border: viewMode === m ? '1px solid #E8E8E8' : '1px solid transparent',
                        boxShadow: viewMode === m ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      {m === 'table' ? <Table2 size={13} /> : <BarChart3 size={13} />}
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gantt view */}
              {viewMode === 'gantt' ? (
                <GanttChart
                  tasks={tasks}
                  onTaskClick={(t: any) => { setEditingTask(t); setIsModalOpen(true); }}
                />
              ) : (
                /* Table view */
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E8E8E8' }}>
                  {/* Filters */}
                  <div
                    className="px-4 py-3 flex flex-wrap gap-3 items-center justify-between"
                    style={{ background: '#F7F6F3', borderBottom: '1px solid #E8E8E8' }}
                  >
                    <div className="relative flex-1 min-w-[220px]">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#AEACAA' }} />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                          paddingLeft: '32px',
                          height: '32px',
                          fontSize: '13px',
                          border: '1px solid #E8E8E8',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          color: '#050505',
                          outline: 'none',
                          width: '100%',
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        style={{
                          height: '32px',
                          fontSize: '12px',
                          border: '1px solid #E8E8E8',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          color: '#050505',
                          padding: '0 8px',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">All Status</option>
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        style={{
                          height: '32px',
                          fontSize: '12px',
                          border: '1px solid #E8E8E8',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          color: '#050505',
                          padding: '0 8px',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">All Priority</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full text-left" style={{ background: '#FFFFFF' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E8E8E8', background: '#F7F6F3' }}>
                        {['', 'Title', 'CVE / Ref', 'Status', 'Priority', 'Due Date', ''].map((h, i) => (
                          <th
                            key={i}
                            className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
                            style={{ color: '#AEACAA' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task: any) => (
                        <tr
                          key={task.id}
                          style={{ borderBottom: '1px solid #F0EFED' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                          {/* Done toggle */}
                          <td className="px-4 py-3 w-10">
                            <button
                              onClick={() => toggleTaskStatus(task)}
                              className="w-5 h-5 rounded flex items-center justify-center transition-all"
                              title={task.status === 'DONE' ? 'Mark as Todo' : 'Mark as Done'}
                              style={{
                                border: task.status === 'DONE' ? 'none' : '1.5px solid #AEACAA',
                                background: task.status === 'DONE' ? '#68B23A' : '#FFFFFF',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                              }}
                            >
                              {task.status === 'DONE' && <Check size={11} strokeWidth={3} />}
                            </button>
                          </td>

                          {/* Title */}
                          <td className="px-4 py-3 max-w-[240px]">
                            <div
                              className="text-sm font-medium flex items-center gap-1.5 flex-wrap"
                              style={{ color: task.status === 'DONE' ? '#AEACAA' : '#050505', textDecoration: task.status === 'DONE' ? 'line-through' : 'none' }}
                            >
                              {task.title}
                              {task.subTasks && task.subTasks.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#F7F6F3', color: '#6B6B6B' }}>
                                  {task.subTasks.filter((s: any) => s.status === 'DONE').length}/{task.subTasks.length}
                                </span>
                              )}
                              {task.recurrence && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#F3F0FF', color: '#7C3AED' }}>
                                  🔁 {task.recurrence}
                                </span>
                              )}
                              {task.attachmentUrl && (
                                <a
                                  href={`${(process.env.NEXT_PUBLIC_API_URL || '').replace('/api', '')}${task.attachmentUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={task.attachmentName}
                                  style={{ color: '#006ADC' }}
                                >
                                  <Paperclip size={13} />
                                </a>
                              )}
                            </div>
                            {task.description && (
                              <div className="text-xs truncate max-w-[200px] mt-0.5" style={{ color: '#AEACAA' }}>
                                {task.description}
                              </div>
                            )}
                          </td>

                          {/* CVE */}
                          <td className="px-4 py-3">
                            {task.cveId ? (
                              <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded" style={{ background: '#F7F6F3', color: '#050505' }}>
                                <FileText size={11} /> {task.cveId}
                              </span>
                            ) : (
                              <span style={{ color: '#D3D3D0' }}>—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <StatusBadge status={task.status} />
                          </td>

                          {/* Priority */}
                          <td className="px-4 py-3">
                            <PriorityBadge priority={task.priority} />
                          </td>

                          {/* Due date */}
                          <td className="px-4 py-3 text-xs" style={{ color: '#6B6B6B' }}>
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : '—'}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditingTask(task); setIsModalOpen(true); }}
                                className="text-xs font-medium"
                                style={{ color: '#006ADC', background: 'none', border: 'none', cursor: 'pointer' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeletingTaskId(task.id)}
                                className="text-xs font-medium"
                                style={{ color: '#EB5757', background: 'none', border: 'none', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {tasks.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-16">
                            <div className="flex flex-col items-center gap-2">
                              <ListTodo size={28} style={{ color: '#E8E8E8' }} />
                              <p className="text-sm" style={{ color: '#AEACAA' }}>No tasks found</p>
                              <button
                                onClick={() => { setEditingTask(null); setIsModalOpen(true); }}
                                className="text-sm font-medium mt-1"
                                style={{ color: '#006ADC', background: 'none', border: 'none', cursor: 'pointer' }}
                              >
                                + Add your first task
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination */}
                  <div
                    className="px-4 py-2.5 flex items-center justify-between"
                    style={{ background: '#F7F6F3', borderTop: '1px solid #E8E8E8' }}
                  >
                    <span className="text-xs" style={{ color: '#AEACAA' }}>
                      Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="p-1.5 rounded-md"
                        style={{
                          border: '1px solid #E8E8E8',
                          background: '#FFFFFF',
                          color: page === 1 ? '#D3D3D0' : '#050505',
                          cursor: page === 1 ? 'default' : 'pointer',
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="p-1.5 rounded-md"
                        style={{
                          border: '1px solid #E8E8E8',
                          background: '#FFFFFF',
                          color: page === totalPages ? '#D3D3D0' : '#050505',
                          cursor: page === totalPages ? 'default' : 'pointer',
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTask(null); }}
        onSuccess={fetchDashboardData}
        task={editingTask}
        availableTasks={tasks}
        workspaceId={activeWorkspaceId}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchDashboardData}
        workspaceId={activeWorkspaceId}
      />

      <UserSettingsModal
        isOpen={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
      />

      {/* Delete confirm dialog */}
      {deletingTaskId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm p-6 rounded-xl"
            style={{ background: '#FFFFFF', border: '1px solid #E8E8E8', boxShadow: '0 8px 40px rgba(0,0,0,0.16)' }}
          >
            <h2 className="text-base font-semibold mb-1" style={{ color: '#050505' }}>Delete task?</h2>
            <p className="text-sm mb-5" style={{ color: '#6B6B6B' }}>
              Are you sure? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingTaskId(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#F7F6F3', border: '1px solid #E8E8E8', color: '#050505', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: '#EB5757', border: 'none', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
