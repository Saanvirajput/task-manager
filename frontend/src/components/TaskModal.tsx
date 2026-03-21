'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSuccess, task }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState('MEDIUM');
    const [cveId, setCveId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [reminderTime, setReminderTime] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

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
        } else {
            setTitle('');
            setDescription('');
            setStatus('TODO');
            setPriority('MEDIUM');
            setCveId('');
            setDueDate('');
            setReminderTime('');
            setAttachment(null);
        }
    }, [task]);

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
                    <button type="submit" className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-md shadow-lg transition-all mt-4">
                        {task ? 'Update' : 'Create'} Task
                    </button>
                </form>
            </div>
        </div>
    );
}
