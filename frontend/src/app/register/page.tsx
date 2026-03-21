'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/register', { name, email, password });
            login(res.data);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-neutral-200">
                <h1 className="text-2xl font-bold text-neutral-800 mb-2">Create Account</h1>
                <p className="text-neutral-500 mb-6 font-medium">Join us to start tracking your data-driven goals.</p>

                {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">Full Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full" placeholder="John Doe" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-800 mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full" placeholder="••••••••" />
                    </div>
                    <button type="submit" className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-md transition-all shadow-md mt-4">Create Account</button>
                </form>

                <p className="mt-6 text-center text-sm text-neutral-600">
                    Already have an account? <Link href="/login" className="text-brand-500 font-bold hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}
