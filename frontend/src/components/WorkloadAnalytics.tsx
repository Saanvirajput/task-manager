'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle2, Clock, BarChart3, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';

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

export default function WorkloadAnalytics({ teamId }: { teamId: string }) {
    const [data, setData] = useState<MemberStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get(`/analytics/workload/${teamId}`);
                setData(res.data);
            } catch (err) {
                console.error('Failed to fetch analytics', err);
                setError('Could not load workload insights.');
            } finally {
                setLoading(false);
            }
        };

        if (teamId) fetchAnalytics();
    }, [teamId]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
            <Loader2 className="animate-spin text-brand-500 mb-6" size={40} />
            <p className="text-sm text-neutral-400 font-black uppercase tracking-widest">Compiling Personnel Intelligence...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
            <ShieldAlert size={64} className="mb-6 opacity-20 text-red-500" />
            <p className="text-xs font-black uppercase tracking-widest">{error}</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Aggregate Stats */}
                <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shadow-sm">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Tactical Health</p>
                            <h3 className="text-xl font-black text-neutral-800 tracking-tight">Team Integrity</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-5xl font-black text-brand-600 tracking-tighter">
                            {Math.round(data.reduce((acc, curr) => acc + curr.healthScore, 0) / (data.length || 1))}%
                        </span>
                        <span className="text-[10px] text-neutral-400 mb-2 font-black uppercase tracking-widest leading-none">Global Efficiency</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Execution</p>
                            <h3 className="text-xl font-black text-neutral-800 tracking-tight">Mission Success</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-5xl font-black text-emerald-600 tracking-tighter">
                            {Math.round((data.reduce((acc, curr) => acc + curr.stats.completed, 0) / (data.reduce((acc, curr) => acc + curr.stats.total, 0) || 1)) * 100)}%
                        </span>
                        <span className="text-[10px] text-neutral-400 mb-2 font-black uppercase tracking-widest leading-none">Completion Index</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Velocity</p>
                            <h3 className="text-xl font-black text-neutral-800 tracking-tight">Active Threads</h3>
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-5xl font-black text-orange-600 tracking-tighter">
                            {data.reduce((acc, curr) => acc + curr.stats.inProgress, 0)}
                        </span>
                        <span className="text-[10px] text-neutral-400 mb-2 font-black uppercase tracking-widest leading-none">Processing Now</span>
                    </div>
                </div>
            </div>

            {/* Individual Breakdown */}
            <div className="bg-white rounded-[2rem] border border-neutral-200 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-neutral-100 bg-neutral-50/30 flex justify-between items-center">
                    <h3 className="font-black text-xl text-neutral-900 tracking-tighter flex items-center gap-3">
                        <ShieldAlert size={24} className="text-brand-500" />
                        Personnel Performance Ledger
                    </h3>
                </div>
                <div className="divide-y divide-neutral-100">
                    {data.map((member) => (
                        <div key={member.userId} className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-10 hover:bg-neutral-50/50 transition-all group">
                            <div className="flex items-center gap-5 min-w-[250px]">
                                <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white font-black text-xl shadow-lg ring-4 ring-brand-50">
                                    {member.name[0].toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black text-lg text-neutral-900 leading-none mb-1">{member.name}</p>
                                    <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">{member.stats.total} Tactical Objectives</p>
                                </div>
                            </div>

                            <div className="flex-1 max-w-lg">
                                <div className="flex justify-between items-end mb-3">
                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Unit Reliability</span>
                                    <span className={`text-lg font-black ${member.healthScore > 70 ? 'text-emerald-600' : member.healthScore > 40 ? 'text-orange-600' : 'text-red-500'}`}>
                                        {member.healthScore}%
                                    </span>
                                </div>
                                <div className="h-4 bg-neutral-100 rounded-full overflow-hidden flex shadow-inner border border-neutral-200 p-0.5">
                                    <div
                                        style={{ width: `${member.healthScore}%` }}
                                        className={`h-full rounded-full transition-all duration-1000 shadow-sm ${member.healthScore > 70 ? 'bg-emerald-500' : member.healthScore > 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-center group-hover:scale-110 transition-transform">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 leading-none">Done</p>
                                    <p className="text-2xl font-black text-emerald-600">{member.stats.completed}</p>
                                </div>
                                <div className="text-center group-hover:scale-110 transition-transform">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 leading-none">Active</p>
                                    <p className="text-2xl font-black text-orange-500">{member.stats.inProgress}</p>
                                </div>
                                <div className="text-center group-hover:scale-110 transition-transform">
                                    <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1 leading-none">Log</p>
                                    <p className="text-2xl font-black text-brand-600">{member.stats.todo}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
