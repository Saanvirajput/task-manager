'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';

interface Notification {
    id: string;
    message: string;
    type: 'REMINDER' | 'OVERDUE';
    isRead: boolean;
    createdAt: string;
    task?: { id: string; title: string; status: string; priority: string } | null;
}

// Toast component
function Toast({ message, type, onClose }: { message: string; type: string; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border-2 text-sm font-black uppercase tracking-widest animate-in slide-in-from-right-8 duration-500 backdrop-blur-md ${type === 'OVERDUE'
            ? 'bg-red-50/90 border-red-200 text-red-800 shadow-red-500/10'
            : 'bg-brand-50/90 border-brand-200 text-brand-800 shadow-brand-500/10'
            }`}>
            {type === 'OVERDUE' ? <AlertTriangle size={18} /> : <ShieldAlert size={18} />}
            <span className="flex-1 max-w-[320px] truncate tracking-tight">{message}</span>
            <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-lg transition-colors">
                <X size={16} />
            </button>
        </div>
    );
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const prevUnreadRef = useRef(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);

            const newUnread = res.data.unreadCount;
            if (newUnread > prevUnreadRef.current && prevUnreadRef.current !== 0) {
                const newNotifs = res.data.notifications
                    .filter((n: Notification) => !n.isRead)
                    .slice(0, newUnread - prevUnreadRef.current);

                newNotifs.forEach((n: Notification) => {
                    setToasts(prev => [...prev, { id: n.id, message: n.message, type: n.type }]);
                });
            }

            setUnreadCount(newUnread);
            prevUnreadRef.current = newUnread;
        } catch (error) {
            // Silently fail
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAsRead = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await api.patch(`/notifications/${id}/read`);
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const markAllAsRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            await api.patch('/notifications/read-all');
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteSelected = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedIds.length === 0) return;

        try {
            setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
            const deletedUnreadCount = notifications.filter(n => selectedIds.includes(n.id) && !n.isRead).length;
            setUnreadCount(prev => Math.max(0, prev - deletedUnreadCount));
            await api.delete('/notifications', { data: { ids: selectedIds } });
            setSelectedIds([]);
            fetchNotifications();
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSelect = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (selectedIds.length === notifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notifications.map(n => n.id));
        }
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const formatTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <>
            {/* Toast Container */}
            <div className="fixed top-8 right-8 z-[100] flex flex-col gap-3">
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </div>

            {/* Bell Icon */}
            <div ref={dropdownRef} className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-3 rounded-2xl hover:bg-neutral-100 transition-all group"
                >
                    <Bell size={22} className="text-neutral-500 group-hover:text-brand-600 transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 w-5 h-5 bg-brand-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center ring-4 ring-white shadow-lg shadow-brand-500/20 animate-bounce">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute right-0 top-16 w-[400px] bg-white rounded-[2rem] shadow-2xl border border-neutral-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-300 ring-1 ring-black/5">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 bg-neutral-50/30">
                            <div className="flex items-center gap-3">
                                <h3 className="font-black text-neutral-900 text-xs uppercase tracking-widest leading-none">Intelligence Hub</h3>
                                {notifications.length > 0 && (
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-[9px] font-black uppercase tracking-widest text-neutral-400 hover:text-brand-600 transition-colors"
                                    >
                                        {selectedIds.length === notifications.length ? 'Clear Selection' : 'Select All'}
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                {selectedIds.length > 0 ? (
                                    <button
                                        onClick={deleteSelected}
                                        className="flex items-center gap-1.5 text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest"
                                    >
                                        <Trash2 size={14} /> Purge ({selectedIds.length})
                                    </button>
                                ) : unreadCount > 0 ? (
                                    <button onClick={markAllAsRead} className="flex items-center gap-1.5 text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest">
                                        <CheckCheck size={14} /> Ack All
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center justify-center gap-4">
                                    <ShieldAlert size={48} className="text-neutral-100" />
                                    <p className="text-[10px] font-black text-neutral-300 uppercase tracking-[0.2em]">All Systems Nominal</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`flex items-start gap-4 p-5 border-b border-neutral-50 hover:bg-neutral-50/50 transition-all cursor-pointer group relative ${!n.isRead ? 'bg-brand-50/20' : ''
                                            } ${selectedIds.includes(n.id) ? 'bg-brand-50/40' : ''}`}
                                        onClick={(e) => !n.isRead && markAsRead(e, n.id)}
                                    >
                                        <button
                                            className={`mt-1.5 h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${selectedIds.includes(n.id)
                                                ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                                                : 'border-neutral-200 bg-white group-hover:border-brand-300'
                                                }`}
                                            onClick={(e) => toggleSelect(e, n.id)}
                                        >
                                            {selectedIds.includes(n.id) && <Check size={12} strokeWidth={4} />}
                                        </button>
                                        <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${n.type === 'OVERDUE' ? 'bg-red-50 text-red-500' : 'bg-brand-50 text-brand-500'
                                            }`}>
                                            {n.type === 'OVERDUE' ? <AlertTriangle size={16} /> : <ShieldAlert size={16} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm tracking-tight ${!n.isRead ? 'font-black text-neutral-900' : 'text-neutral-500 font-medium'}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                <Clock size={10} /> {formatTime(n.createdAt)}
                                            </p>
                                        </div>
                                        {!n.isRead && !selectedIds.includes(n.id) && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-brand-500 mt-2.5 shrink-0 shadow-[0_0_10px_rgba(123,104,238,0.5)]" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
