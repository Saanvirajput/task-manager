'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
    ChevronDown,
    Plus,
    Users,
    User,
    Settings,
    Layout
} from 'lucide-react';
import CreateTeamModal from './CreateTeamModal';
import TeamSettingsModal from './TeamSettingsModal';

interface Team {
    id: string;
    name: string;
    slug: string;
    myRole: string;
}

interface TeamSwitcherProps {
    onTeamChange: (id: string | null) => void;
    activeTeamId: string | null;
}

export default function TeamSwitcher({ onTeamChange, activeTeamId }: TeamSwitcherProps) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsTeamId, setSettingsTeamId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await api.get('/teams/my');
                setTeams(res.data);
            } catch (err) {
                console.error('Failed to fetch teams', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    const activeTeam = teams.find(t => t.id === activeTeamId);

    return (
        <div className="relative mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3.5 bg-white border border-neutral-200 rounded-2xl hover:border-brand-300 transition-all shadow-sm group"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${activeTeamId ? 'bg-brand-50 text-brand-600' : 'bg-neutral-100 text-neutral-600'}`}>
                        {activeTeamId ? <Users size={20} /> : <User size={20} />}
                    </div>
                    <div className="text-left overflow-hidden">
                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">Select Team</p>
                        <p className="text-sm font-bold text-neutral-800 truncate">
                            {activeTeam?.name || 'Personal Intelligence'}
                        </p>
                    </div>
                </div>
                <ChevronDown size={14} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''} group-hover:text-brand-500`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-neutral-200 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 max-h-[400px] flex flex-col">
                        <div className="p-3 border-b border-neutral-100 bg-neutral-50/50">
                            <p className="px-2 py-1 text-[10px] font-black text-neutral-400 uppercase tracking-widest">Available Teams</p>
                        </div>

                        <div className="overflow-y-auto p-2 space-y-1">
                            {/* Personal Option */}
                            <button
                                onClick={() => {
                                    onTeamChange(null);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${!activeTeamId ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-neutral-50 text-neutral-600'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${!activeTeamId ? 'bg-white shadow-sm text-brand-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                    <User size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm">Personal Intelligence</p>
                                    <p className="text-[10px] opacity-70 uppercase font-black">Private Shield</p>
                                </div>
                            </button>

                            {teams.map((team) => (
                                <div key={team.id} className="flex items-center group/team">
                                    <button
                                        onClick={() => {
                                            onTeamChange(team.id);
                                            setIsOpen(false);
                                        }}
                                        className={`flex-1 flex items-center gap-3 p-3 rounded-xl transition-all ${activeTeamId === team.id ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-neutral-50 text-neutral-600'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTeamId === team.id ? 'bg-white shadow-sm text-brand-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                            <Users size={18} />
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-sm truncate">{team.name}</p>
                                            <p className="text-[10px] opacity-70 uppercase font-black tracking-tighter">{team.myRole}</p>
                                        </div>
                                    </button>
                                    {(team.myRole === 'ADMIN' || team.myRole === 'MANAGER') && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSettingsTeamId(team.id);
                                                setIsSettingsOpen(true);
                                                setIsOpen(false);
                                            }}
                                            className="p-2 text-neutral-300 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all ml-1"
                                            title="Team Settings"
                                        >
                                            <Settings size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-2 border-t border-neutral-100">
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(true);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl text-neutral-500 hover:bg-neutral-50 hover:text-brand-600 transition-all group/new"
                            >
                                <div className="w-10 h-10 rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center group-hover/new:border-brand-300 transition-all">
                                    <Plus size={18} />
                                </div>
                                <span className="text-sm font-bold">Initialize New Team</span>
                            </button>
                        </div>
                    </div>

                    <CreateTeamModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={(newTeam: any) => {
                            setTeams([...teams, newTeam]);
                            onTeamChange(newTeam.id);
                        }}
                    />
                </>
            )}

            {isSettingsOpen && settingsTeamId && (
                <TeamSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => { setIsSettingsOpen(false); setSettingsTeamId(null); }}
                    teamId={settingsTeamId}
                />
            )}
        </div>
    );
}
