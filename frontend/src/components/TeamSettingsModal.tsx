'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, UserPlus, Shield, ShieldCheck, Eye, Crown, Trash2, Loader2, Clock, Zap, Plus, Users, ShieldAlert } from 'lucide-react';

interface Member {
    id: string;
    userId: string;
    role: string;
    user: { id: string; name: string; email: string };
}

interface TeamSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId: string;
}

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    ADMIN: { label: 'Admin', icon: Crown, color: 'text-brand-700', bg: 'bg-brand-50' },
    MANAGER: { label: 'Manager', icon: ShieldAlert, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    MEMBER: { label: 'Member', icon: Shield, color: 'text-emerald-700', bg: 'bg-emerald-50' }
};

export default function TeamSettingsModal({ isOpen, onClose, teamId }: TeamSettingsModalProps) {
    const [team, setTeam] = useState<any>(null);
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

    const fetchTeam = async () => {
        try {
            const res = await api.get(`/teams/${teamId}`);
            setTeam(res.data);
            setMembers(res.data.members || []);
        } catch (err) {
            console.error('Failed to fetch team', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && teamId) {
            setLoading(true);
            fetchTeam();
        }
    }, [isOpen, teamId]);

    const fetchAuditLogs = async () => {
        setLoadingLogs(true);
        try {
            const res = await api.get(`/audit/${teamId}`);
            setAuditLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'AUDIT' && teamId && (team?.myRole === 'ADMIN' || team?.myRole === 'MANAGER')) {
            fetchAuditLogs();
        }
    }, [activeTab, teamId, team]);

    const fetchIntegrations = async () => {
        setLoadingIntegrations(true);
        try {
            const res = await api.get(`/integrations/${teamId}`);
            setIntegrations(res.data);
        } catch (err) {
            console.error('Failed to fetch integrations', err);
        } finally {
            setLoadingIntegrations(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'INTEGRATIONS' && teamId && team?.myRole === 'ADMIN') {
            fetchIntegrations();
        }
    }, [activeTab, teamId, team]);

    const handleAddIntegration = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWebhookUrl.trim()) return;
        setAddingIntegration(true);
        setError(null);
        try {
            await api.post(`/integrations/${teamId}`, { type: 'SLACK', webhookUrl: newWebhookUrl });
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
            await api.post(`/teams/${teamId}/invite`, { email: inviteEmail, role: inviteRole });
            setSuccess(`${inviteEmail} invited as ${inviteRole}`);
            setInviteEmail('');
            fetchTeam();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to invite');
        } finally {
            setInviting(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setError(null);
        try {
            await api.put(`/teams/${teamId}/members/${userId}/role`, { role: newRole });
            fetchTeam();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update role');
        }
    };

    const handleRemove = async (userId: string, name: string) => {
        if (!confirm(`Remove ${name} from this team?`)) return;
        setError(null);
        try {
            await api.delete(`/teams/${teamId}/members/${userId}`);
            fetchTeam();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to remove member');
        }
    };

    if (!isOpen) return null;

    const isAdmin = team?.myRole === 'ADMIN';
    const isManager = team?.myRole === 'MANAGER';
    const hasAuditAccess = isAdmin || isManager;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-neutral-200 animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="p-8 border-b border-neutral-100 flex justify-between items-center bg-white">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-2 py-0.5 rounded-full">Secure Management</span>
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-neutral-50 px-2 py-0.5 rounded-full">RBAC V2.0</span>
                        </div>
                        <h2 className="text-2xl font-black text-neutral-900 tracking-tighter">
                            {team?.name || 'Team'} Intelligence
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-neutral-100 rounded-2xl transition-all">
                        <X size={20} className="text-neutral-400" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex border-b border-neutral-100 bg-neutral-50/30 px-8">
                    <button onClick={() => setActiveTab('MEMBERS')} className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'MEMBERS' ? 'border-brand-500 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>Members</button>
                    {hasAuditAccess && <button onClick={() => setActiveTab('AUDIT')} className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'AUDIT' ? 'border-brand-500 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>Audits</button>}
                    {isAdmin && <button onClick={() => setActiveTab('INTEGRATIONS')} className={`py-4 px-6 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'INTEGRATIONS' ? 'border-brand-500 text-brand-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}>Automations</button>}
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-brand-500" size={40} />
                        </div>
                    ) : activeTab === 'MEMBERS' ? (
                        <div className="space-y-8">
                            {/* Invite Form */}
                            {(isAdmin || isManager) && (
                                <form onSubmit={handleInvite} className="p-6 bg-neutral-50 rounded-2xl border border-neutral-200 shadow-inner">
                                    <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <UserPlus size={14} className="text-brand-500" /> Secure Invite Protocol
                                    </label>
                                    <div className="flex gap-3">
                                        <input
                                            type="email"
                                            placeholder="enterprise@domain.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            className="flex-1 text-sm font-bold py-3 px-4 rounded-xl border-2 border-neutral-100 focus:border-brand-500 outline-none transition-all"
                                            required
                                        />
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="text-xs font-black py-3 px-4 rounded-xl border-2 border-neutral-100 outline-none uppercase tracking-tighter"
                                        >
                                            <option value="MANAGER">Manager</option>
                                            <option value="MEMBER">Member</option>
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={inviting}
                                            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                                        >
                                            {inviting ? <Loader2 className="animate-spin" size={16} /> : 'Dispatch'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {error && <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold animate-shake">{error}</div>}
                            {success && <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-xs font-bold">✅ {success}</div>}

                            <div>
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-4">Current Personnel ({members.length})</h3>
                                <div className="space-y-3">
                                    {members.map((member) => {
                                        const isOwner = team?.ownerId === member.userId;
                                        const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.MEMBER;
                                        const RoleIcon = roleConf.icon;

                                        return (
                                            <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-neutral-100 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 transition-all group">
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-black text-lg shadow-sm">
                                                        {(member.user.name || member.user.email)[0].toUpperCase()}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-black text-neutral-800 truncate">{member.user.name || 'Incognito User'}</p>
                                                            {isOwner && <Crown size={14} className="text-amber-500" />}
                                                        </div>
                                                        <p className="text-xs text-neutral-400 font-medium truncate">{member.user.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {(isAdmin || (isManager && member.role === 'MEMBER')) && !isOwner ? (
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                                            className={`text-[10px] font-black py-2 px-3 rounded-xl border-0 outline-none cursor-pointer uppercase tracking-widest ${roleConf.bg} ${roleConf.color}`}
                                                        >
                                                            <option value="ADMIN">Admin</option>
                                                            <option value="MANAGER">Manager</option>
                                                            <option value="MEMBER">Member</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-1.5 ${roleConf.bg} ${roleConf.color}`}>
                                                            <RoleIcon size={12} /> {roleConf.label}
                                                        </span>
                                                    )}

                                                    {((isAdmin && !isOwner) || (isManager && member.role === 'MEMBER')) && (
                                                        <button onClick={() => handleRemove(member.userId, member.user.name || member.user.email)} className="p-2.5 bg-neutral-50 text-neutral-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'INTEGRATIONS' ? (
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Zap size={14} className="text-yellow-500" /> Webhook Synchronization
                                </h3>
                                <form onSubmit={handleAddIntegration} className="flex gap-3">
                                    <input
                                        type="url"
                                        placeholder="Slack Hook URL..."
                                        value={newWebhookUrl}
                                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                                        className="flex-1 text-sm font-bold py-3 px-4 rounded-xl border-2 border-neutral-100 focus:border-brand-500 outline-none transition-all"
                                        required
                                    />
                                    <button type="submit" disabled={addingIntegration} className="px-8 py-3 bg-black text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2">
                                        {addingIntegration ? <Loader2 className="animate-spin" size={16} /> : 'Connect'}
                                    </button>
                                </form>
                            </div>

                            <div>
                                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">Active Data-Streams</h3>
                                {loadingIntegrations ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-brand-500" size={32} /></div> : integrations.length === 0 ? (
                                    <div className="text-center py-16 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
                                        <Zap size={40} className="mx-auto text-neutral-300 mb-4" />
                                        <p className="text-sm text-neutral-400 font-bold uppercase tracking-tighter">No active streams detected.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {integrations.map((integration) => (
                                            <div key={integration.id} className="flex items-center justify-between p-5 bg-white border border-neutral-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">SL</div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-sm font-black text-neutral-800">{integration.type} AGENT</p>
                                                        <p className="text-[10px] text-neutral-400 font-bold truncate max-w-[250px] uppercase tracking-tighter">{integration.webhookUrl}</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDeleteIntegration(integration.id)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loadingLogs ? <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-brand-500" size={40} /></div> : auditLogs.length === 0 ? (
                                <div className="text-center text-neutral-400 py-20 font-bold uppercase tracking-widest text-xs italic">Clear Ledger - No History</div>
                            ) : auditLogs.map((log: any) => (
                                <div key={log.id} className="p-5 border border-neutral-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex gap-5 items-start">
                                    <div className="bg-brand-50 p-3 rounded-2xl text-brand-600 mt-1 shadow-sm"><Clock size={18} /></div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-black text-xs uppercase tracking-widest text-neutral-900">{log.action}</p>
                                            <span className="text-[10px] font-bold text-neutral-400 bg-neutral-50 px-2 py-1 rounded-lg">{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-xs text-neutral-500 font-medium">
                                            Operator <span className="text-brand-600 font-bold underline decoration-brand-200">{log.user.name || log.user.email}</span> executed action on {log.resourceType}
                                        </p>
                                        {log.details && <pre className="mt-3 text-[10px] bg-neutral-900 text-neutral-400 p-4 rounded-xl border-l-4 border-brand-500 overflow-x-auto font-mono">{JSON.stringify(log.details, null, 2)}</pre>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
