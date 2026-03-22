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
import CreateWorkspaceModal from './CreateWorkspaceModal';
import WorkspaceSettingsModal from './WorkspaceSettingsModal';

interface Workspace {
    id: string;
    name: string;
    slug: string;
    myRole: string;
}

interface WorkspaceSwitcherProps {
    onWorkspaceChange: (id: string | null) => void;
    activeWorkspaceId: string | null;
}

export default function WorkspaceSwitcher({ onWorkspaceChange, activeWorkspaceId }: WorkspaceSwitcherProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsWorkspaceId, setSettingsWorkspaceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const res = await api.get('/workspaces/my');
                setWorkspaces(res.data);
            } catch (err) {
                console.error('Failed to fetch workspaces', err);
            } finally {
                setLoading(false);
            }
        };
        fetchWorkspaces();
    }, []);

    const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);

    return (
        <div className="relative mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl hover:border-indigo-300 transition-all shadow-sm group"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${activeWorkspaceId ? 'bg-indigo-100 text-indigo-600' : 'bg-neutral-100 text-neutral-600'}`}>
                        {activeWorkspaceId ? <Users size={18} /> : <User size={18} />}
                    </div>
                    <div className="text-left overflow-hidden">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider leading-none mb-1">Workspace</p>
                        <p className="text-sm font-bold text-neutral-800 truncate">
                            {activeWorkspace?.name || 'Personal Space'}
                        </p>
                    </div>
                </div>
                <ChevronDown size={16} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''} group-hover:text-indigo-500`} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-neutral-100 bg-neutral-50/50">
                            <p className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Select Environment</p>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-1">
                            {/* Personal Option */}
                            <button
                                onClick={() => {
                                    onWorkspaceChange(null);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${!activeWorkspaceId ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-neutral-50 text-neutral-700'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${!activeWorkspaceId ? 'bg-indigo-100 text-indigo-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                    <User size={16} />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-semibold">Personal Space</p>
                                    <p className="text-[10px] opacity-70">Private to you</p>
                                </div>
                            </button>

                            {workspaces.map((workspace) => (
                                <div key={workspace.id} className="flex items-center mt-1">
                                    <button
                                        onClick={() => {
                                            onWorkspaceChange(workspace.id);
                                            setIsOpen(false);
                                        }}
                                        className={`flex-1 flex items-center gap-3 p-2 rounded-lg transition-colors ${activeWorkspaceId === workspace.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-neutral-50 text-neutral-700'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeWorkspaceId === workspace.id ? 'bg-indigo-100 text-indigo-600' : 'bg-neutral-100 text-neutral-400'}`}>
                                            <Users size={16} />
                                        </div>
                                        <div className="text-left overflow-hidden">
                                            <p className="text-sm font-semibold truncate">{workspace.name}</p>
                                            <p className="text-[10px] opacity-70 uppercase">{workspace.myRole}</p>
                                        </div>
                                    </button>
                                    {workspace.myRole === 'ADMIN' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSettingsWorkspaceId(workspace.id);
                                                setIsSettingsOpen(true);
                                                setIsOpen(false);
                                            }}
                                            className="p-1.5 text-neutral-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all ml-1"
                                            title="Workspace Settings"
                                        >
                                            <Settings size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-1 border-t border-neutral-100">
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(true);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-2 rounded-lg text-neutral-500 hover:bg-neutral-50 hover:text-indigo-600 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center">
                                    <Plus size={16} />
                                </div>
                                <span className="text-sm font-medium">Create New Workspace</span>
                            </button>
                        </div>
                    </div>

                    <CreateWorkspaceModal
                        isOpen={isCreateModalOpen}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSuccess={(newWs: any) => {
                            setWorkspaces([...workspaces, newWs]);
                            onWorkspaceChange(newWs.id);
                        }}
                    />
                </>
            )}

            {isSettingsOpen && settingsWorkspaceId && (
                <WorkspaceSettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => { setIsSettingsOpen(false); setSettingsWorkspaceId(null); }}
                    workspaceId={settingsWorkspaceId}
                />
            )}
        </div>
    );
}
