'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, Plus, Trash2, CheckCircle2, Circle, RefreshCw, Link2, Users, Shield } from 'lucide-react';
import TaskComments from './TaskComments';

export default function TaskModal({ isOpen, onClose, onSuccess, task, teamId, availableTasks = [], teamMembers = [] }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState('MEDIUM');
    const [visibility, setVisibility] = useState('TEAM');
    const [assignedToId, setAssignedToId] = useState('');
    const [cveId, setCveId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [subTasks, setSubTasks] = useState<any[]>([]);
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
    const [recurrence, setRecurrence] = useState('');
    const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
    const [customFields, setCustomFields] = useState<Record<string, string>>({});
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(task.priority);
            setVisibility(task.visibility || 'TEAM');
            setAssignedToId(task.assignedToId || '');
            setCveId(task.cveId || '');
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
            setReminderTime(task.reminderTime ? new Date(task.reminderTime).toISOString().slice(0, 16) : '');
            setAttachment(null);
            setRecurrence(task.recurrence || '');
            setSelectedDependencies(task.dependsOn?.map((d: any) => d.id) || []);
            setCustomFields(task.customFields || {});
            fetchSubTasks(task.id);
        } else {
            setTitle('');
            setDescription('');
            setStatus('TODO');
            setPriority('MEDIUM');
            setVisibility('TEAM');
            setAssignedToId('');
            setCveId('');
            setDueDate('');
            setReminderTime('');
            setAttachment(null);
            setSubTasks([]);
            setRecurrence('');
            setSelectedDependencies([]);
            setCustomFields({});
        }
    }, [task]);

    const addCustomField = () => {
        if (!newFieldKey.trim()) return;
        setCustomFields({ ...customFields, [newFieldKey]: newFieldValue });
        setNewFieldKey('');
        setNewFieldValue('');
    };

    const removeCustomField = (key: string) => {
        const next = { ...customFields };
        delete next[key];
        setCustomFields(next);
    };

    const fetchSubTasks = async (parentId: string) => {
        try {
            const { data } = await api.get(`/tasks?parentId=${parentId}&limit=100`);
            setSubTasks(data.tasks);
        } catch (error) {
            console.error('Failed to fetch subtasks', error);
        }
    };

    const addSubTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubTaskTitle.trim()) return;

        if (task) {
            try {
                await api.post('/tasks', {
                    title: newSubTaskTitle,
                    parentId: task.id,
                    status: 'TODO',
                    teamId: teamId || undefined,
                    assignedToId: assignedToId || undefined
                });
                setNewSubTaskTitle('');
                fetchSubTasks(task.id);
            } catch (error) {
                console.error('Failed to add subtask', error);
            }
        } else {
            setSubTasks([...subTasks, { title: newSubTaskTitle, status: 'TODO', id: Math.random().toString() }]);
            setNewSubTaskTitle('');
        }
    };

    const toggleSubTaskStatus = async (sub: any) => {
        const newSubStatus = sub.status === 'DONE' ? 'TODO' : 'DONE';
        if (task) {
            try {
                await api.put(`/tasks/${sub.id}`, { ...sub, status: newSubStatus });
                fetchSubTasks(task.id);
            } catch (error) {
                console.error('Failed to toggle subtask status', error);
            }
        } else {
            setSubTasks(subTasks.map(s => s.id === sub.id ? { ...s, status: newSubStatus } : s));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('status', status);
            formData.append('priority', priority);
            formData.append('visibility', visibility);
            if (assignedToId) formData.append('assignedToId', assignedToId);
            if (cveId) formData.append('cveId', cveId);
            if (dueDate) formData.append('dueDate', new Date(dueDate).toISOString());
            if (reminderTime) formData.append('reminderTime', new Date(reminderTime).toISOString());
            if (attachment) formData.append('attachment', attachment);
            if (teamId && !task) formData.append('teamId', teamId);
            if (recurrence) formData.append('recurrence', recurrence);
            selectedDependencies.forEach(id => formData.append('dependsOnIds', id));
            formData.append('customFields', JSON.stringify(customFields));

            if (task) {
                await api.put(`/tasks/${task.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/tasks', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to save task', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
            <div className="bg-white shadow-2xl max-w-lg w-full p-8 border border-[var(--border)] animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{task ? 'Edit Task' : 'New Task'}</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-[var(--hover)] rounded transition-colors">
                        <X size={18} className="text-[var(--secondary-foreground)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Title</label>
                        <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                className="notion-input text-sm font-medium"
                                placeholder="What needs to be done?"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Description</label>
                        <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                className="notion-input text-sm resize-none"
                                placeholder="Add context or notes..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Assignee</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="notion-input text-sm appearance-none">
                                    <option value="">Unassigned</option>
                                    {teamMembers.map((m: any) => (
                                        <option key={m.userId} value={m.userId}>{m.user?.name || m.user?.email}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Priority</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="notion-input text-sm appearance-none">
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Status</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="notion-input text-sm appearance-none">
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Visibility</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="notion-input text-sm appearance-none">
                                    <option value="PRIVATE">Private</option>
                                    <option value="TEAM">Team</option>
                                    <option value="PUBLIC">Public</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Reference (CVE/ID)</label>
                        <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                            <input
                                type="text"
                                value={cveId}
                                onChange={(e) => setCveId(e.target.value)}
                                className="notion-input text-sm"
                                placeholder="e.g. CVE-2024-XXXX"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Due Date</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="notion-input text-xs" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Reminder</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <input type="datetime-local" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="notion-input text-xs" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Recurrence</label>
                        <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="notion-input text-sm appearance-none">
                                <option value="">None</option>
                                <option value="DAILY">Daily</option>
                                <option value="WEEKLY">Weekly</option>
                                <option value="MONTHLY">Monthly</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1 font-mono">Custom Fields</label>
                        <div className="space-y-2">
                            {Object.entries(customFields).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 group">
                                    <div className="flex-1 flex items-center border border-[var(--border)] rounded overflow-hidden">
                                        <span className="bg-[var(--hover)] text-[10px] font-bold px-2 py-1.5 border-r border-[var(--border)] min-w-[80px] text-center uppercase tracking-tighter">{key}</span>
                                        <span className="text-xs px-2 py-1.5 flex-1 truncate">{value}</span>
                                    </div>
                                    <button onClick={() => removeCustomField(key)} className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Key" value={newFieldKey} onChange={(e) => setNewFieldKey(e.target.value)} className="flex-1 p-2 border border-[var(--border)] rounded text-xs focus:border-[var(--brand)] outline-none" />
                            <input type="text" placeholder="Value" value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} className="flex-1 p-2 border border-[var(--border)] rounded text-xs focus:border-[var(--brand)] outline-none" />
                            <button type="button" onClick={addCustomField} className="notion-button px-3"><Plus size={16} /></button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full h-11 bg-[var(--foreground)] text-[var(--background)] font-semibold rounded hover:opacity-90 transition-all shadow-sm active:scale-[0.98] mt-8"
                    >
                        {task ? 'Update workspace task' : 'Establish new task'}
                    </button>
                </form>

                <div className="mt-12 pt-8 border-t border-[var(--border)]">
                    <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-[0.1em] mb-6 flex items-center gap-2">
                        <Link2 size={14} className="text-[var(--secondary-foreground)]" /> Associated Sub-tasks
                    </h3>
                    <div className="space-y-1">
                        {subTasks.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between group p-2 rounded hover:bg-[var(--hover)] transition-colors">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleSubTaskStatus(sub)} className="transition-colors">
                                        {sub.status === 'DONE' ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} className="text-[var(--border)]" />}
                                    </button>
                                    <span className={`text-sm ${sub.status === 'DONE' ? 'text-[var(--secondary-foreground)] line-through' : 'text-[var(--foreground)]'}`}>{sub.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {task && (
                    <div className="mt-8">
                        <TaskComments taskId={task.id} teamId={teamId} />
                    </div>
                )}
            </div>
        </div>
    );
}
