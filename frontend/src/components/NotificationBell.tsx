'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, X } from 'lucide-react';

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
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border text-sm font-medium animate-in slide-in-from-right duration-300 ${type === 'OVERDUE'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            {type === 'OVERDUE' ? <AlertTriangle size={16} /> : <Clock size={16} />}
            <span className="flex-1 max-w-[280px] truncate">{message}</span>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                <X size={14} />
            </button>
        </div>
    );
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);
    const prevUnreadRef = useRef(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);

            // Show toasts for new notifications
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
            // Silently fail - don't spam console during polling
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown on outside click
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
            // Optimistic update
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
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            await api.patch('/notifications/read-all');
            fetchNotifications();
        } catch (err) {
            console.error(err);
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
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map(t => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </div>

            {/* Bell Icon */}
            <div ref={dropdownRef} className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                    <Bell size={22} className="text-neutral-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border border-neutral-200 z-50 overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
                            <h3 className="font-bold text-neutral-800 text-sm">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-600 z-10 relative">
                                    <CheckCheck size={14} /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-neutral-400 text-sm">
                                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                                    No notifications yet
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`flex items-start gap-3 p-3 border-b border-neutral-50 hover:bg-neutral-50/80 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/30' : ''
                                            }`}
                                        onClick={(e) => !n.isRead && markAsRead(e, n.id)}
                                    >
                                        <div className={`mt-1 p-1.5 rounded-full ${n.type === 'OVERDUE' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'
                                            }`}>
                                            {n.type === 'OVERDUE' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!n.isRead ? 'font-semibold text-neutral-800' : 'text-neutral-600'}`}>
                                                {n.message}
                                            </p>
                                            <p className="text-xs text-neutral-400 mt-0.5">{formatTime(n.createdAt)}</p>
                                        </div>
                                        {!n.isRead && (
                                            <div className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
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
