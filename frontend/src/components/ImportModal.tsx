'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { X, Upload, FileText, CheckCircle2, Loader2, AlertCircle, ShieldPlus } from 'lucide-react';

interface ExtractedTask {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export default function ImportModal({ isOpen, onClose, onSuccess, teamId }: any) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewTasks, setPreviewTasks] = useState<ExtractedTask[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
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

            const planTasks = res.data.tasks || [];
            const schedule = res.data.schedule || [];

            const tasksWithSchedule = planTasks.map((task: any) => {
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
            setSelectedIndices(new Set(tasksWithSchedule.map((_: any, i: number) => i)));
            setStatus('PREVIEW');
        } catch (err) {
            console.error(err);
            setError('Extraction failed. Verify document eligibility.');
            setStatus('IDLE');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (selectedIndices.size === 0) return;
        setLoading(true);
        setStatus('IMPORTING');
        try {
            for (const idx of Array.from(selectedIndices)) {
                await api.post('/tasks', {
                    ...previewTasks[idx],
                    teamId: teamId || undefined,
                    visibility: 'TEAM'
                });
            }
            setStatus('SUCCESS');
            setTimeout(() => {
                onSuccess();
                onClose();
                reset();
            }, 1500);
        } catch (err) {
            console.error(err);
            setError('Import protocol interrupted.');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewTasks([]);
        setSelectedIndices(new Set());
        setStatus('IDLE');
        setError(null);
    };

    const toggleSelection = (idx: number) => {
        const newSet = new Set(selectedIndices);
        if (newSet.has(idx)) {
            newSet.delete(idx);
        } else {
            newSet.add(idx);
        }
        setSelectedIndices(newSet);
    };

    const toggleAll = () => {
        if (selectedIndices.size === previewTasks.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(previewTasks.map((_, i) => i)));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xl z-[60] flex items-center justify-center p-4 transition-all duration-500">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-neutral-200 animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500">
                {/* Header */}
                <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-2xl font-black text-neutral-900 tracking-tighter flex items-center gap-3">
                            <ShieldPlus className="text-brand-500" size={28} />
                            {status === 'SUCCESS' ? 'Mission Success' : 'AI Intel Ingestion'}
                        </h2>
                        <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1">Autonomous Task Extraction Protocol ✨</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-neutral-100 rounded-2xl transition-all">
                        <X size={20} className="text-neutral-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10">
                    {status === 'IDLE' && (
                        <div className="space-y-8">
                            <div className="border-4 border-dashed border-neutral-100 rounded-3xl p-16 flex flex-col items-center justify-center bg-neutral-50/30 hover:bg-white hover:border-brand-200 transition-all cursor-pointer group relative shadow-inner">
                                <input type="file" onChange={handleFileChange} accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-all shadow-sm">
                                    <FileText className="text-brand-500" size={40} />
                                </div>
                                <h3 className="font-black text-neutral-800 text-xl tracking-tight">{file ? file.name : 'Drop Intel PDF Here'}</h3>
                                <p className="text-neutral-400 text-xs font-black uppercase tracking-widest mt-2 px-6 py-1 bg-neutral-50 rounded-full">Encrypted Transport Active</p>
                            </div>

                            {file && (
                                <button onClick={handleExtract} disabled={loading} className="w-full py-5 bg-black text-white font-black rounded-2xl shadow-2xl shadow-black/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Execute AI Parsing'}
                                </button>
                            )}
                        </div>
                    )}

                    {status === 'EXTRACTING' && (
                        <div className="py-24 flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-brand-50 border-t-brand-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="text-brand-500 animate-pulse" size={32} />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-black text-neutral-900 tracking-tight italic">Analyzing Personnel Directives...</h3>
                                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-2">Neural Net Integration Active ✨</p>
                            </div>
                        </div>
                    )}

                    {status === 'PREVIEW' && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-black text-neutral-900 uppercase tracking-widest text-xs">Directives Identified ({previewTasks.length})</h3>
                                    <button onClick={toggleAll} className="text-[10px] font-black text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl transition-all uppercase tracking-widest hover:shadow-md">
                                        {selectedIndices.size === previewTasks.length ? 'Clear' : 'Check All'}
                                    </button>
                                </div>
                                <button onClick={reset} className="text-[10px] font-black text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-widest">Abort</button>
                            </div>
                            <div className="space-y-3">
                                {previewTasks.map((task, idx) => (
                                    <label key={idx} className={`p-5 rounded-2xl transition-all flex gap-5 cursor-pointer items-start border-2 ${selectedIndices.has(idx) ? 'bg-white border-brand-500 shadow-lg' : 'bg-neutral-50/50 border-transparent text-neutral-400 opacity-60'}`}>
                                        <div className="pt-1.5">
                                            <input
                                                type="checkbox"
                                                checked={selectedIndices.has(idx)}
                                                onChange={() => toggleSelection(idx)}
                                                className="w-5 h-5 text-brand-500 rounded-lg border-neutral-300 focus:ring-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-black text-neutral-800 tracking-tight">{task.title}</div>
                                            <div className="text-[10px] font-medium leading-relaxed line-clamp-2 mt-1 uppercase tracking-tight">{task.description || 'No detailed directive found.'}</div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase border ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
                                            task.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-brand-50 text-brand-600 border-brand-100'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <button onClick={handleImport} disabled={loading || selectedIndices.size === 0} className={`w-full py-5 text-white font-black rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm ${selectedIndices.size === 0 ? 'bg-neutral-200 cursor-not-allowed text-neutral-400' : 'bg-black hover:shadow-brand-500/10'}`}>
                                {loading ? <Loader2 className="animate-spin" size={20} /> : `Commit ${selectedIndices.size} Strategic Unit${selectedIndices.size === 1 ? '' : 's'}`}
                            </button>
                        </div>
                    )}

                    {status === 'IMPORTING' && (
                        <div className="py-24 flex flex-col items-center justify-center space-y-6">
                            <Loader2 className="text-brand-500 animate-spin" size={60} />
                            <div className="text-center">
                                <h3 className="text-xl font-black text-neutral-900 tracking-tight">Syncing Operational Ledger...</h3>
                                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-2">Database Integrity verified 🔗</p>
                            </div>
                        </div>
                    )}

                    {status === 'SUCCESS' && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="w-24 h-24 bg-brand-50 rounded-[2rem] flex items-center justify-center animate-bounce shadow-xl">
                                <CheckCircle2 className="text-brand-500" size={56} />
                            </div>
                            <div>
                                <h3 className="font-black text-neutral-900 text-3xl tracking-tighter">Strategic Victory</h3>
                                <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mt-2">All Directives successfully Integrated.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-5 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-4 text-red-600 text-xs font-black uppercase tracking-widest animate-shake">
                            <AlertCircle size={24} />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
