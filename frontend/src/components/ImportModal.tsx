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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-[var(--border)] animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 rounded-lg">
                <div className="p-8 border-b border-[var(--border)] flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-3">
                            <ShieldPlus className="text-[var(--foreground)]" size={24} />
                            {status === 'SUCCESS' ? 'Import Complete' : 'AI Intel Ingestion'}
                        </h2>
                        <p className="text-[10px] text-[var(--secondary-foreground)] font-bold uppercase tracking-widest mt-1">Autonomous Task Extraction Protocol</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--hover)] rounded transition-colors">
                        <X size={20} className="text-[var(--secondary-foreground)]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
                    {status === 'IDLE' && (
                        <div className="space-y-8">
                            <div className="border border-dashed border-[var(--border)] rounded-lg p-16 flex flex-col items-center justify-center bg-[var(--background)] hover:border-[var(--secondary-foreground)]/50 transition-all cursor-pointer group relative">
                                <input type="file" onChange={handleFileChange} accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" />
                                <div className="w-16 h-16 bg-[var(--hover)] rounded flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
                                    <FileText className="text-[var(--foreground)]" size={32} />
                                </div>
                                <h3 className="font-bold text-[var(--foreground)] text-lg tracking-tight">{file ? file.name : 'Click to select Intel PDF'}</h3>
                                <p className="text-[11px] text-[var(--secondary-foreground)] font-bold uppercase tracking-wider mt-2">PDF FORMAT REQUIRED</p>
                            </div>

                            {file && (
                                <button
                                    onClick={handleExtract}
                                    disabled={loading}
                                    className="w-full h-12 bg-[var(--foreground)] text-[var(--background)] font-bold rounded hover:opacity-90 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Extract Tasks'}
                                </button>
                            )}
                        </div>
                    )}

                    {status === 'EXTRACTING' && (
                        <div className="py-24 flex flex-col items-center justify-center space-y-6">
                            <Loader2 className="text-[var(--foreground)] animate-spin" size={48} />
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Analyzing Directives...</h3>
                                <p className="text-[10px] text-[var(--secondary-foreground)] font-bold uppercase tracking-widest mt-2">Neural Link Active</p>
                            </div>
                        </div>
                    )}

                    {status === 'PREVIEW' && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                                <h3 className="font-bold text-[var(--foreground)] uppercase tracking-widest text-[10px]">Directives Identified ({previewTasks.length})</h3>
                                <div className="flex gap-4">
                                    <button onClick={toggleAll} className="text-[10px] font-bold text-[var(--foreground)] hover:underline decoration-[var(--border)] underline-offset-4 uppercase">
                                        {selectedIndices.size === previewTasks.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <button onClick={reset} className="text-[10px] font-bold text-red-500 hover:underline decoration-red-200 underline-offset-4 uppercase">Reset</button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {previewTasks.map((task, idx) => (
                                    <label key={idx} className={`p-4 rounded border transition-all flex gap-4 cursor-pointer items-start ${selectedIndices.has(idx) ? 'bg-white border-[var(--foreground)]' : 'bg-[var(--background)] border-[var(--border)] opacity-60'}`}>
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedIndices.has(idx)}
                                                onChange={() => toggleSelection(idx)}
                                                className="w-4 h-4 rounded border-[var(--border)] text-[var(--foreground)] focus:ring-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-sm text-[var(--foreground)] tracking-tight">{task.title}</div>
                                            <div className="text-[11px] text-[var(--secondary-foreground)] leading-relaxed mt-1 line-clamp-2">{task.description || 'No detailed directive found.'}</div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' :
                                            task.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-[var(--hover)] text-[var(--foreground)] border-[var(--border)]'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <button
                                onClick={handleImport}
                                disabled={loading || selectedIndices.size === 0}
                                className={`w-full h-12 text-[var(--background)] font-bold rounded shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 uppercase tracking-widest text-xs ${selectedIndices.size === 0 ? 'bg-[var(--border)] cursor-not-allowed' : 'bg-[var(--foreground)] hover:opacity-90'}`}
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : `Commit ${selectedIndices.size} Strategic Units`}
                            </button>
                        </div>
                    )}

                    {status === 'IMPORTING' && (
                        <div className="py-24 flex flex-col items-center justify-center space-y-6">
                            <Loader2 className="text-[var(--foreground)] animate-spin" size={48} />
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-[var(--foreground)] tracking-tight">Syncing Operational Ledger...</h3>
                                <p className="text-[10px] text-[var(--secondary-foreground)] font-bold uppercase tracking-widest mt-2">Database Integrity Verified</p>
                            </div>
                        </div>
                    )}

                    {status === 'SUCCESS' && (
                        <div className="py-20 flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="w-20 h-20 bg-[var(--hover)] rounded-full flex items-center justify-center animate-bounce">
                                <CheckCircle2 className="text-green-500" size={40} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[var(--foreground)] text-2xl tracking-tight">Import Successful</h3>
                                <p className="text-[var(--secondary-foreground)] font-medium text-sm mt-1">All directives have been integrated into your workspace.</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded text-red-600 text-[11px] font-bold uppercase tracking-widest flex items-center gap-3">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
