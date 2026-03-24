'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    CheckSquare,
    Bell,
    Settings,
    LogOut,
    Search,
    Plus,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

function NotionLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="6" fill="black" />
      <path d="M8.5 8.5H14.5L22 20.5V11.5H24V23.5H18L10.5 11.5V20.5H8.5V8.5Z" fill="white" />
    </svg>
  );
}

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
        <div className="w-[240px] h-screen bg-[#F7F6F3] border-r border-[#E8E8E8] flex flex-col fixed left-0 top-0 overflow-hidden select-none">
            {/* User Workspace Header */}
            <div 
                className="px-3 py-3 mx-2 mt-2 rounded-md cursor-pointer flex items-center justify-between group hover:bg-[#EBEBEA] transition-colors"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <NotionLogo size={20} />
                    <span className="font-semibold text-[14px] truncate text-[#050505]">
                        {user.name}'s Workspace
                    </span>
                </div>
                <ChevronDown size={14} className="text-[#AEACAA]" />
            </div>

            {/* Primary Actions */}
            <div className="px-2 mt-4 space-y-[1px]">
                <div className="sidebar-item group">
                    <Search size={16} className="text-[#6B6B6B] group-hover:text-[#050505]" />
                    <span className="text-sm">Search</span>
                </div>
                <div className="sidebar-item group">
                    <Plus size={16} className="text-[#6B6B6B] group-hover:text-[#050505]" />
                    <span className="text-sm">New Task</span>
                </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-2 mt-4 space-y-[1px]">
                <div className="px-3 pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#AEACAA]">
                        Workspace
                    </span>
                </div>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.name} href={item.href}>
                            <div className={`sidebar-item ${isActive ? 'bg-[#EBEBEA] text-[#050505] font-semibold' : 'text-[#6B6B6B]'}`}>
                                <Icon size={16} className={isActive ? 'text-[#050505]' : 'text-[#6B6B6B]'} />
                                <span className="text-sm">{item.name}</span>
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Profile Section */}
            <div className="p-2 border-t border-[#E8E8E8] space-y-[1px]">
                <div className="sidebar-item group text-[#6B6B6B] hover:text-[#050505]" onClick={logout}>
                    <LogOut size={16} />
                    <span className="text-sm">Log out</span>
                </div>

                <div className="px-3 py-2 flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#6B6B6B]"></div>
                    <span className="text-[10px] font-bold tracking-tight uppercase text-[#6B6B6B]">
                        TaskFlow Workspace
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
