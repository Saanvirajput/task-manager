'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { X, Layout, Loader2, Users } from 'lucide-react';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newTeam: any) => void;
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/teams', { name });
            onSuccess(res.data);
            setName('');
            onClose();
        } catch (err: any) {
            console.error('Failed to create team', err);
            setError(err.response?.data?.error || 'Failed to create team. Try a unique name.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-neutral-200 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                            <Users size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-neutral-800 tracking-tight">New Team</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                        <X size={20} className="text-neutral-400" />
                    </button>
                </div>

                <p className="text-neutral-500 mb-8 font-medium">Create a dedicated space for your team, project, or department.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2">Team Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Engineering, Cyber-Defense, GlobalOps"
                            className="w-full text-lg font-bold py-3 px-4 rounded-xl border-2 border-neutral-100 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-black rounded-xl shadow-xl shadow-brand-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Initialize Team'}
                    </button>
                </form>
            </div>
        </div>
    );
}
