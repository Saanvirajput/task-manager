'use client';

import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TasksPage() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-[var(--hover)] text-[var(--foreground)] rounded-2xl flex items-center justify-center border border-[var(--border)] shadow-sm">
                <Construction size={32} />
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Full Task View</h1>
                <p className="text-[var(--secondary-foreground)] max-w-sm mx-auto">
                    We're building a comprehensive database view for your tasks. For now, use the Dashboard grid.
                </p>
            </div>
            <Link
                href="/dashboard"
                className="notion-button inline-flex items-center gap-2 px-4 py-2"
            >
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
            </Link>
        </div>
    );
}
