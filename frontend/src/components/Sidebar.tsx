'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    Bell,
    Settings,
    User,
    LogOut,
    Search,
    Plus
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

const Sidebar = () => {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'All Tasks', icon: CheckSquare, href: '/tasks' },
        { name: 'Notifications', icon: Bell, href: '/notifications' },
        { name: 'Settings', icon: Settings, href: '/settings' },
    ];

    if (!user) return null;

    return (
        <div className="w-[240px] h-screen bg-[var(--sidebar-background)] border-r border-[var(--border)] flex flex-col fixed left-0 top-0 overflow-hidden select-none">
            {/* User Workspace Header */}
            <div className="px-4 py-3 flex items-center justify-between group cursor-pointer hover:bg-[var(--hover)] transition-colors">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-5 h-5 rounded-sm bg-brand-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                        {user.name?.[0] || 'U'}
                    </div>
                    <span className="font-medium text-[14px] truncate">{user.name}'s Workspace</span>
                </div>
            </div>

            {/* Primary Actions */}
            <div className="px-2 mt-2">
                <div className="sidebar-item group">
                    <Search size={16} className="text-[var(--secondary-foreground)]" />
                    <span>Search</span>
                </div>
                <div className="sidebar-item group">
                    <Plus size={16} className="text-[var(--secondary-foreground)]" />
                    <span>New Task</span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-2 mt-4 space-y-[1px]">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <div className={`sidebar-item ${isActive ? 'bg-[var(--selection)] text-[var(--foreground)]' : ''}`}>
                                <Icon size={16} className={isActive ? 'text-[var(--foreground)]' : 'text-[var(--secondary-foreground)]'} />
                                <span className={isActive ? 'font-medium' : ''}>{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Profile Section */}
            <div className="p-2 border-t border-[var(--border)] space-y-2">
                <div className="sidebar-item justify-between" onClick={logout}>
                    <div className="flex items-center gap-2">
                        <LogOut size={16} />
                        <span>Log out</span>
                    </div>
                </div>

                <div className="px-2 py-1 flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity">
                    <div className="w-1 h-1 rounded-full bg-[var(--secondary-foreground)]"></div>
                    <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">Build by Saanvi Rajput</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
