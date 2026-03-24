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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 select-none">
            <div className="bg-white shadow-2xl max-w-md w-full p-10 border border-[var(--border)] animate-in fade-in zoom-in duration-300 rounded-lg">
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[var(--hover)] rounded flex items-center justify-center text-[var(--foreground)]">
                            <Users size={20} />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">New Workspace</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--hover)] rounded transition-colors">
                        <X size={20} className="text-[var(--secondary-foreground)]" />
                    </button>
                </div>

                <p className="text-[var(--secondary-foreground)] mb-10 font-medium text-xs leading-relaxed">
                    Initialize a dedicated workspace for your team, department, or specialized operations.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-[var(--secondary-foreground)] uppercase tracking-[0.15em] pl-1 font-mono">Workspace Identifier</label>
                        <div className="p-3 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Engineering, global-ops"
                                className="w-full text-base font-medium outline-none notion-input bg-transparent"
                                required
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-[11px] font-bold bg-red-50 p-4 rounded border border-red-100 uppercase tracking-widest animate-shake">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="w-full h-12 bg-[var(--foreground)] text-[var(--background)] disabled:opacity-30 font-bold rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : 'Initialize Team'}
                    </button>
                </form>
            </div>
        </div>
    );
}
