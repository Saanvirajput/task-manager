'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { X, Upload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface ExtractedTask {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function ImportModal({ isOpen, onClose, onSuccess }: any) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewTasks, setPreviewTasks] = useState<ExtractedTask[]>([]);
    const [status, setStatus] = useState<'IDLE' | 'EXTRACTING' | 'PREVIEW' | 'IMPORTING' | 'SUCCESS'>('IDLE');
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected && selected.type === 'application/pdf') {
            setFile(selected);
            setError(null);
        } else {
            setError('Please select a valid PDF file.');
        }
    };

    const handleExtract = async () => {
        if (!file) return;
        setLoading(true);
        setStatus('EXTRACTING');
        try {
            const formData = new FormData();
            formData.append('attachment', file);
            const res = await api.post('/tasks/extract-pdf', formData);

            // Map the schedule back to the tasks
            const planTasks = res.data.tasks || [];
            const schedule = res.data.schedule || [];

            const tasksWithSchedule = planTasks.map((task: any) => {
                // Find if this task is scheduled for a specific day
                const scheduledDay = schedule.find((s: any) =>
                    s.tasks.some((st: string) => st.toLowerCase() === task.title.toLowerCase())
                );

                if (scheduledDay) {
                    return {
                        ...task,
                        description: `[Scheduled for Day ${scheduledDay.day}] ${task.description || ''}`.trim()
                    };
                }
                return task;
            });

            setPreviewTasks(tasksWithSchedule);
            setStatus('PREVIEW');
        } catch (err) {
            console.error(err);
            setError('Failed to extract tasks. Ensure the PDF has readable text.');
            setStatus('IDLE');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        setLoading(true);
        setStatus('IMPORTING');
        try {
            // Sequential import for simplicity and to avoid rate limits/concurency issues
            for (const task of previewTasks) {
                await api.post('/tasks', task);
            }
            setStatus('SUCCESS');
            setTimeout(() => {
                onSuccess();
                onClose();
                reset();
            }, 1500);
        } catch (err) {
            console.error(err);
            setError('Import failed midway. Please check your dashboard.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewTasks([]);
        setStatus('IDLE');
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-neutral-200 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <div>
                        <h2 className="text-xl font-black text-neutral-800 tracking-tight flex items-center gap-2">
                            <Upload className="text-brand-500" size={24} />
                            {status === 'SUCCESS' ? 'Import Complete!' : 'AI PDF Task Importer'}
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium">Auto-schedule tasks from any document ✨</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-all group">
                        <X size={20} className="text-neutral-400 group-hover:text-neutral-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {status === 'IDLE' && (
                        <div className="space-y-6">
                            <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-12 flex flex-col items-center justify-center bg-neutral-50/50 hover:bg-neutral-50 hover:border-brand-300 transition-all cursor-pointer group relative">
                                <input type="file" onChange={handleFileChange} accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <FileText className="text-brand-500" size={32} />
                                </div>
                                <h3 className="font-bold text-neutral-800 text-lg">{file ? file.name : 'Click to upload PDF'}</h3>
                                <p className="text-neutral-400 text-sm font-medium">Max size: 5MB • .pdf format only</p>
                            </div>

                            {file && (
                                <button onClick={handleExtract} disabled={loading} className="w-full py-4 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-xl shadow-xl shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Start AI Extraction'}
                                </button>
                            )}
                        </div>
                    )}

                    {status === 'EXTRACTING' && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="text-brand-500 animate-pulse" size={24} />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="font-bold text-neutral-800">Reading your document...</h3>
                                <p className="text-neutral-500 text-sm">Our AI is identifying tasks and priorities ✨</p>
                            </div>
                        </div>
                    )}

                    {status === 'PREVIEW' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black text-neutral-800 uppercase tracking-wider text-xs">Identified Tasks ({previewTasks.length})</h3>
                                <button onClick={reset} className="text-xs font-bold text-neutral-400 hover:text-red-500 transition-colors">Start Over</button>
                            </div>
                            <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-50">
                                {previewTasks.map((task, idx) => (
                                    <div key={idx} className="p-4 bg-white hover:bg-neutral-50/50 transition-colors flex gap-4">
                                        <div className="flex-1">
                                            <div className="font-bold text-neutral-800">{task.title}</div>
                                            <div className="text-xs text-neutral-400 line-clamp-1">{task.description || 'No description extracted.'}</div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter uppercase ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                                                task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleImport} disabled={loading} className="w-full py-4 bg-neutral-900 hover:bg-black text-white font-black rounded-xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                                {loading ? <Loader2 className="animate-spin" size={20} /> : `Import ${previewTasks.length} Tasks`}
                            </button>
                        </div>
                    )}

                    {status === 'IMPORTING' && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="text-brand-500 animate-spin" size={48} />
                            <div className="text-center">
                                <h3 className="font-bold text-neutral-800">Scheduling Tasks...</h3>
                                <p className="text-neutral-500 text-sm">Syncing with your database 🔗</p>
                            </div>
                        </div>
                    )}

                    {status === 'SUCCESS' && (
                        <div className="py-16 flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle2 className="text-green-500" size={48} />
                            </div>
                            <div className="text-center">
                                <h3 className="font-black text-neutral-800 text-2xl">Awesome!</h3>
                                <p className="text-neutral-500 font-medium">All tasks have been successfully scheduled.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold animate-shake">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
