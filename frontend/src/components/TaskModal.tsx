'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, Plus, Trash2, CheckCircle2, Circle, RefreshCw, Link2 } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSuccess, task, workspaceId, availableTasks = [] }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState('MEDIUM');
    const [cveId, setCveId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [subTasks, setSubTasks] = useState<any[]>([]);
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
    const [recurrence, setRecurrence] = useState('');
    const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(task.priority);
            setCveId(task.cveId || '');
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
            setReminderTime(task.reminderTime ? new Date(task.reminderTime).toISOString().slice(0, 16) : '');
            setAttachment(null);
            setRecurrence(task.recurrence || '');
            setSelectedDependencies(task.dependsOn?.map((d: any) => d.id) || []);
            fetchSubTasks(task.id);
        } else {
            setTitle('');
            setDescription('');
            setStatus('TODO');
            setPriority('MEDIUM');
            setCveId('');
            setDueDate('');
            setReminderTime('');
            setAttachment(null);
            setSubTasks([]);
            setRecurrence('');
            setSelectedDependencies([]);
        }
    }, [task]);

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
                    workspaceId: workspaceId || undefined
                });
                setNewSubTaskTitle('');
                fetchSubTasks(task.id);
            } catch (error) {
                console.error('Failed to add subtask', error);
            }
        } else {
            // For new tasks, we'll stage them locally and save after parent creation
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
            if (cveId) formData.append('cveId', cveId);
            if (dueDate) formData.append('dueDate', new Date(dueDate).toISOString());
            if (reminderTime) formData.append('reminderTime', new Date(reminderTime).toISOString());
            if (attachment) formData.append('attachment', attachment);
            if (workspaceId && !task) formData.append('workspaceId', workspaceId);
            if (recurrence) formData.append('recurrence', recurrence);
            selectedDependencies.forEach(id => formData.append('dependsOnIds', id));

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-neutral-800">{task ? 'Edit Task' : 'New Task'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-full transition-colors">
                        <X size={20} className="text-neutral-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full" placeholder="What needs to be done?" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full resize-none" placeholder="Add more details..." />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">CVE ID / Task Reference</label>
                        <input type="text" value={cveId} onChange={(e) => setCveId(e.target.value)} className="w-full" placeholder="e.g. CVE-2024-1234" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-1">Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full appearance-none">
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="DONE">Done</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-1">Priority</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full appearance-none">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-1">Due Date</label>
                            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-neutral-800 mb-1">Reminder Time</label>
                            <input type="datetime-local" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="w-full" />
                            <p className="text-xs text-neutral-400 mt-0.5">Auto-set to 1hr before due date if left empty</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">PDF Attachment (Task info/CVE details)</label>
                        <input type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} accept=".pdf" className="w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" />
                    </div>
                    {/* Recurrence */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
                            <RefreshCw size={14} /> Recurrence
                        </label>
                        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="w-full appearance-none">
                            <option value="">None (One-time)</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                        </select>
                        {recurrence && (
                            <p className="text-xs text-purple-500 mt-1 font-medium">🔁 A new task will be auto-created when this one is completed</p>
                        )}
                    </div>
                    {/* Dependencies Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
                            <Link2 size={14} /> Blocked By (Dependencies)
                        </label>
                        <select
                            multiple
                            value={selectedDependencies}
                            onChange={(e) => {
                                const options = Array.from(e.target.selectedOptions, option => option.value);
                                setSelectedDependencies(options);
                            }}
                            className="w-full text-sm rounded-lg border-neutral-200 focus:ring-indigo-500 min-h-[80px]"
                        >
                            {availableTasks
                                .filter((t: any) => t.id !== task?.id) // Prevent self-dependency
                                .map((t: any) => (
                                    <option key={t.id} value={t.id} className="p-1">
                                        {t.title} ({t.status.replace('_', ' ')})
                                    </option>
                                ))}
                        </select>
                        <p className="text-xs text-neutral-400 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple tasks</p>

                        {/* Display existing dependencies nicely if any are selected */}
                        {selectedDependencies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {selectedDependencies.map(depId => {
                                    const depInfo = availableTasks.find((t: any) => t.id === depId);
                                    if (!depInfo) return null;
                                    return (
                                        <span key={depId} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${depInfo.status === 'DONE' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {depInfo.status === 'DONE' ? '✅' : '⏳'} {depInfo.title}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-md shadow-lg transition-all mt-4">
                        {task ? 'Update' : 'Create'} Task
                    </button>
                </form>

                {/* Sub-tasks Section */}
                <div className="mt-8 pt-6 border-t border-neutral-100">
                    <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">
                        Sub-tasks
                        <span className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full">
                            {subTasks.filter(s => s.status === 'DONE').length}/{subTasks.length}
                        </span>
                    </h3>

                    <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                        {subTasks.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleSubTaskStatus(sub)} className="text-neutral-400 hover:text-brand-500 transition-colors">
                                        {sub.status === 'DONE' ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
                                    </button>
                                    <span className={`text-sm ${sub.status === 'DONE' ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                                        {sub.title}
                                    </span>
                                </div>
                                <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={addSubTask} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add sub-task..."
                            value={newSubTaskTitle}
                            onChange={(e) => setNewSubTaskTitle(e.target.value)}
                            className="flex-1 text-sm py-1.5"
                        />
                        <button type="submit" className="p-2 bg-neutral-100 hover:bg-brand-500 hover:text-white rounded-md transition-all">
                            <Plus size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
