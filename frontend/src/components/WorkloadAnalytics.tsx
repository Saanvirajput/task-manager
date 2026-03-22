'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle2, Clock, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

interface MemberStats {
    userId: string;
    name: string;
    stats: {
        total: number;
        completed: number;
        inProgress: number;
        todo: number;
    };
    healthScore: number;
}

export default function WorkloadAnalytics({ workspaceId }: { workspaceId: string }) {
    const [data, setData] = useState<MemberStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get(`/analytics/workload/${workspaceId}`);
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
                setError('Could not load workload insights.');
            } finally {
                setLoading(false);
            }
        };

        if (workspaceId) fetchAnalytics();
    }, [workspaceId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
            <p className="text-sm text-neutral-400 font-medium">Analyzing team workload...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p className="text-sm font-medium">{error}</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Aggregate Stats */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <BarChart3 size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Global Status</p>
                            <h3 className="text-lg font-bold text-neutral-800">Team Health</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-indigo-600">
                            {Math.round(data.reduce((acc, curr) => acc + curr.healthScore, 0) / data.length)}%
                        </span>
                        <span className="text-xs text-neutral-400 mb-1.5 font-bold uppercase tracking-wider">Average Capacity</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Efficiency</p>
                            <h3 className="text-lg font-bold text-neutral-800">Completion Rate</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-emerald-600">
                            {Math.round((data.reduce((acc, curr) => acc + curr.stats.completed, 0) / data.reduce((acc, curr) => acc + curr.stats.total, 0)) * 100) || 0}%
                        </span>
                        <span className="text-xs text-neutral-400 mb-1.5 font-bold uppercase tracking-wider">Overall</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-neutral-400 uppercase tracking-widest">Velocity</p>
                            <h3 className="text-lg font-bold text-neutral-800">Under Review</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-amber-600">
                            {data.reduce((acc, curr) => acc + curr.stats.inProgress, 0)}
                        </span>
                        <span className="text-xs text-neutral-400 mb-1.5 font-bold uppercase tracking-wider">Active Tasks</span>
                    </div>
                </div>
            </div>

            {/* Individual Breakdown */}
            <div className="bg-white rounded-3xl border border-neutral-100 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-neutral-50 bg-neutral-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                        <BarChart3 size={18} className="text-indigo-500" />
                        Member Workload Analysis
                    </h3>
                </div>
                <div className="divide-y divide-neutral-50">
                    {data.map((member) => (
                        <div key={member.userId} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-neutral-50/50 transition-colors">
                            <div className="flex items-center gap-4 min-w-[200px]">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
                                    {member.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-neutral-800">{member.name}</p>
                                    <p className="text-xs text-neutral-400 font-medium">{member.stats.total} total tasks assigned</p>
                                </div>
                            </div>

                            <div className="flex-1 max-w-md">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Health Score</span>
                                    <span className={`text-sm font-black ${member.healthScore > 70 ? 'text-emerald-600' : member.healthScore > 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {member.healthScore}%
                                    </span>
                                </div>
                                <div className="h-3 bg-neutral-100 rounded-full overflow-hidden flex shadow-inner border border-neutral-200">
                                    <div
                                        style={{ width: `${member.healthScore}%` }}
                                        className={`h-full transition-all duration-1000 ${member.healthScore > 70 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : member.healthScore > 40 ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Done</p>
                                    <p className="text-lg font-black text-emerald-600">{member.stats.completed}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Active</p>
                                    <p className="text-lg font-black text-amber-600">{member.stats.inProgress}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Todo</p>
                                    <p className="text-lg font-black text-indigo-600">{member.stats.todo}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
