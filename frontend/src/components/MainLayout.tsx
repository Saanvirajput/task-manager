'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)]">
                <div className="animate-pulse text-[var(--secondary-foreground)]">Loading workspace...</div>
            </div>
        );
    }

    // If not logged in, just show the children (Login/Register pages)
    if (!user) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-[var(--background)]">
            <Sidebar />
            <main className="flex-1 ml-[240px] relative">
                {/* Top Header Placeholder (Notion-style) */}
                <header className="h-[45px] px-4 flex items-center justify-between sticky top-0 bg-[var(--background)]/80 backdrop-blur-sm z-10 select-none">
                    <div className="flex items-center gap-2 text-[12px] text-[var(--secondary-foreground)]">
                        <span className="hover:text-[var(--foreground)] cursor-pointer">Workspace</span>
                        <span>/</span>
                        <span className="text-[var(--foreground)] font-medium">Dashboard</span>
                    </div>
                </header>

                {/* Page Content */}
                <div className="max-w-[1200px] mx-auto px-10 py-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
