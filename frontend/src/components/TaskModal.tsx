'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSuccess, task }: any) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('TODO');
    const [priority, setPriority] = useState('MEDIUM');

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setPriority(task.priority);
        } else {
            setTitle('');
            setDescription('');
            setStatus('TODO');
            setPriority('MEDIUM');
        }
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (task) {
                await api.put(`/tasks/${task.id}`, { title, description, status, priority });
            } else {
                await api.post('/tasks', { title, description, status, priority });
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
                    <button type="submit" className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-md shadow-lg transition-all mt-4">
                        {task ? 'Update' : 'Create'} Task
                    </button>
                </form>
            </div>
        </div>
    );
}
