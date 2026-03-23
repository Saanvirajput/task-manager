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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
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

                    <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider">
                        <div>
                            <label className="block text-neutral-400 mb-1 flex items-center gap-1.5"><Users size={12} /> Assigned To</label>
                            <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)} className="w-full">
                                <option value="">Select Member</option>
                                {teamMembers.map((m: any) => (
                                    <option key={m.userId} value={m.userId}>{m.user?.name || m.user?.email}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-neutral-400 mb-1 flex items-center gap-1.5"><Shield size={12} /> Visibility</label>
                            <select value={visibility} onChange={(e) => setVisibility(e.target.value)} className="w-full">
                                <option value="PRIVATE">Private</option>
                                <option value="TEAM">Team Only</option>
                                <option value="PUBLIC">Public</option>
                            </select>
                        </div>
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
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">PDF Attachment</label>
                        <input type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} accept=".pdf" className="w-full text-sm" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
                            <RefreshCw size={14} /> Recurrence
                        </label>
                        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} className="w-full">
                            <option value="">None</option>
                            <option value="DAILY">Daily</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                        </select>
                    </div>

                    {/* Custom Fields */}
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">Custom Fields</label>
                        <div className="space-y-2 mb-3">
                            {Object.entries(customFields).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                                    <span className="text-xs font-black text-neutral-400 uppercase w-24 truncate">{key}:</span>
                                    <span className="text-sm text-neutral-700 flex-1 truncate">{value}</span>
                                    <button onClick={() => removeCustomField(key)} className="text-neutral-300 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" placeholder="Key" value={newFieldKey} onChange={(e) => setNewFieldKey(e.target.value)} className="w-1/3 text-xs" />
                            <input type="text" placeholder="Value" value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} className="flex-1 text-xs" />
                            <button type="button" onClick={addCustomField} className="p-2 bg-neutral-100 rounded-lg"><Plus size={16} /></button>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-md shadow-lg transition-all mt-4">
                        {task ? 'Update' : 'Create'} Task
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-neutral-100">
                    <h3 className="text-sm font-bold text-neutral-800 mb-4 flex items-center gap-2">Sub-tasks</h3>
                    <div className="space-y-2 mb-4">
                        {subTasks.map(sub => (
                            <div key={sub.id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-neutral-50">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toggleSubTaskStatus(sub)} className="text-neutral-400">
                                        {sub.status === 'DONE' ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} />}
                                    </button>
                                    <span className={`text-sm ${sub.status === 'DONE' ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>{sub.title}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {task && <TaskComments taskId={task.id} teamId={teamId} />}
            </div>
        </div>
    );
}
