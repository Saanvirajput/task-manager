'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, UserPlus, Shield, ShieldCheck, Eye, Crown, Trash2, Loader2, Clock, Zap, Plus } from 'lucide-react';

interface Member {
    id: string;
    userId: string;
    role: string;
    user: { id: string; name: string; email: string };
}

interface WorkspaceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    ADMIN: { label: 'Admin', icon: ShieldCheck, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    MEMBER: { label: 'Member', icon: Shield, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    VIEWER: { label: 'Viewer', icon: Eye, color: 'text-neutral-600', bg: 'bg-neutral-100' },
};

export default function WorkspaceSettingsModal({ isOpen, onClose, workspaceId }: WorkspaceSettingsModalProps) {
    const [workspace, setWorkspace] = useState<any>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('MEMBER');
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'MEMBERS' | 'AUDIT' | 'INTEGRATIONS'>('MEMBERS');
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [loadingIntegrations, setLoadingIntegrations] = useState(false);
    const [addingIntegration, setAddingIntegration] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const fetchWorkspace = async () => {
        try {
            const res = await api.get(`/workspaces/${workspaceId}`);
            setWorkspace(res.data);
            setMembers(res.data.members || []);
        } catch (err) {
            console.error('Failed to fetch workspace', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && workspaceId) {
            setLoading(true);
            fetchWorkspace();
        }
    }, [isOpen, workspaceId]);

    const fetchAuditLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await api.get(`/workspaces/${workspaceId}/audit-logs`);
            setAuditLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'AUDIT' && workspaceId && workspace?.myRole === 'ADMIN') {
            fetchAuditLogs();
        }
    }, [activeTab, workspaceId, workspace]);

    const fetchIntegrations = async () => {
        setLoadingIntegrations(true);
        try {
            const res = await api.get(`/integrations/${workspaceId}`);
            setIntegrations(res.data);
        } catch (err) {
            console.error('Failed to fetch integrations', err);
        } finally {
            setLoadingIntegrations(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'INTEGRATIONS' && workspaceId && workspace?.myRole === 'ADMIN') {
            fetchIntegrations();
        }
    }, [activeTab, workspaceId, workspace]);

    const handleAddIntegration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWebhookUrl.trim()) return;
        setAddingIntegration(true);
        setError(null);
        try {
            await api.post(`/integrations/${workspaceId}`, { type: 'SLACK', webhookUrl: newWebhookUrl });
            setNewWebhookUrl('');
            fetchIntegrations();
            setSuccess('Slack integration added successfully!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add integration');
        } finally {
            setAddingIntegration(false);
        }
    };

    const handleDeleteIntegration = async (id: string) => {
        if (!confirm('Delete this integration?')) return;
        setError(null);
        try {
            await api.delete(`/integrations/${id}`);
            fetchIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete integration');
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;
        setInviting(true);
        setError(null);
        setSuccess(null);
        try {
            await api.post(`/workspaces/${workspaceId}/invite`, { email: inviteEmail, role: inviteRole });
            setSuccess(`${inviteEmail} invited as ${inviteRole}`);
            setInviteEmail('');
            fetchWorkspace();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to invite');
        } finally {
            setInviting(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setError(null);
        try {
            await api.put(`/workspaces/${workspaceId}/members/${userId}/role`, { role: newRole });
            fetchWorkspace();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update role');
        }
    };

    const handleRemove = async (userId: string, name: string) => {
        if (!confirm(`Remove ${name} from this workspace?`)) return;
        setError(null);
        try {
            await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
            fetchWorkspace();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to remove member');
        }
    };

    if (!isOpen) return null;

    const isAdmin = workspace?.myRole === 'ADMIN';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden border border-neutral-200 animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
                    <div>
                        <h2 className="text-xl font-black text-neutral-800 tracking-tight">
                            {workspace?.name || 'Workspace'} Settings
                        </h2>
                        <p className="text-sm text-neutral-500 font-medium">Manage team members & permissions</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-colors">
                        <X size={20} className="text-neutral-400" />
                    </button>
                </div>

                {/* Tabs for Admins */}
                {isAdmin && (
                    <div className="flex border-b border-neutral-100 bg-neutral-50 px-6">
                        <button onClick={() => setActiveTab('MEMBERS')} className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'MEMBERS' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Members</button>
                        <button onClick={() => setActiveTab('AUDIT')} className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'AUDIT' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Audit Logs</button>
                        <button onClick={() => setActiveTab('INTEGRATIONS')} className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'INTEGRATIONS' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}>Integrations</button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-indigo-500" size={32} />
                        </div>
                    ) : activeTab === 'MEMBERS' ? (
                        <>
                            {/* Invite Form */}
                            {isAdmin && (
                                <form onSubmit={handleInvite} className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                    <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">
                                        <UserPlus size={12} className="inline mr-1" /> Invite Member
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder="colleague@company.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="flex-1 text-sm py-2 px-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            required
                                        />
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="text-sm py-2 px-3 rounded-lg border border-neutral-200 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="ADMIN">Admin</option>
                                            <option value="MEMBER">Member</option>
                                            <option value="VIEWER">Viewer</option>
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={inviting}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50"
                                        >
                                            {inviting ? <Loader2 className="animate-spin" size={16} /> : 'Invite'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Feedback */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-bold">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-lg text-green-600 text-sm font-bold">
                                    ✅ {success}
                                </div>
                            )}

                            {/* Members List */}
                            <div>
                                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-3">
                                    Team Members ({members.length})
                                </h3>
                                <div className="space-y-2">
                                    {members.map((member) => {
                                        const isOwner = workspace?.ownerId === member.userId;
                                        const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.MEMBER;
                                        const RoleIcon = roleConf.icon;

                                        return (
                                            <div
                                                key={member.id}
                                                className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                        {(member.user.name || member.user.email)[0].toUpperCase()}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-neutral-800 truncate">
                                                                {member.user.name || 'Unnamed'}
                                                            </p>
                                                            {isOwner && (
                                                                <Crown size={14} className="text-amber-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-neutral-400 truncate">{member.user.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isAdmin && !isOwner ? (
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                                            className={`text-xs font-bold py-1 px-2 rounded-lg border-0 outline-none cursor-pointer ${roleConf.bg} ${roleConf.color}`}
                                                        >
                                                            <option value="ADMIN">Admin</option>
                                                            <option value="MEMBER">Member</option>
                                                            <option value="VIEWER">Viewer</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${roleConf.bg} ${roleConf.color}`}>
                                                            <RoleIcon size={10} className="inline mr-1" />
                                                            {roleConf.label}
                                                        </span>
                                                    )}

                                                    {isAdmin && !isOwner && (
                                                        <button
                                                            onClick={() => handleRemove(member.userId, member.user.name || member.user.email)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-neutral-300"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'INTEGRATIONS' ? (
                        <div className="space-y-6">
                            {/* Feedback */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm font-bold">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-green-600 text-sm font-bold">
                                    ✅ {success}
                                </div>
                            )}

                            <div>
                                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">Add Slack Webhook</h3>
                                <form onSubmit={handleAddIntegration} className="flex gap-2">
                                    <input
                                        type="url"
                                        placeholder="https://hooks.slack.com/services/..."
                                        value={newWebhookUrl}
                                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                                        className="flex-1 text-sm py-2 px-3 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={addingIntegration}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {addingIntegration ? <Loader2 className="animate-spin" size={16} /> : <><Plus size={16} /> Add</>}
                                    </button>
                                </form>
                            </div>

                            <div className="pt-4 border-t border-neutral-100">
                                <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-4">Active Integrations</h3>
                                {loadingIntegrations ? (
                                    <div className="flex justify-center py-6">
                                        <Loader2 className="animate-spin text-indigo-500" size={24} />
                                    </div>
                                ) : integrations.length === 0 ? (
                                    <div className="text-center py-8 bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                                        <Zap size={32} className="mx-auto text-neutral-300 mb-2" />
                                        <p className="text-sm text-neutral-400">No active integrations. Add a Slack webhook to receive real-time updates.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {integrations.map((integration) => (
                                            <div key={integration.id} className="flex items-center justify-between p-4 bg-white border border-neutral-100 rounded-xl shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                                                        S
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-neutral-800">{integration.type}</p>
                                                        <p className="text-xs text-neutral-400 truncate max-w-[200px]">{integration.webhookUrl}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteIntegration(integration.id)}
                                                    className="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loadingLogs ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="animate-spin text-indigo-500" size={32} />
                                </div>
                            ) : auditLogs.length === 0 ? (
                                <div className="text-center text-neutral-400 py-12 text-sm italic">No activity recorded yet in this workspace.</div>
                            ) : (
                                auditLogs.map((log: any) => (
                                    <div key={log.id} className="p-4 border border-neutral-100 rounded-xl bg-white shadow-sm flex gap-4 items-start">
                                        <div className="bg-indigo-50 p-2 rounded-full text-indigo-600 mt-1">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-sm text-neutral-800">{log.action}</p>
                                                <span className="text-xs text-neutral-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                                            </div>
                                            <p className="text-xs text-neutral-500 mt-1">
                                                User <span className="font-bold">{log.user.name || log.user.email}</span> acted on {log.resourceType} {log.resourceId ? `(${log.resourceId.split('-')[0]})` : ''}
                                            </p>
                                            {log.details && (
                                                <pre className="mt-2 text-[10px] bg-neutral-50 p-2 rounded border border-neutral-100 text-neutral-600 overflow-x-auto">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
