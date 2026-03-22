'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaToken, setMfaToken] = useState('');
    const [requiresMfa, setRequiresMfa] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (requiresMfa) {
                // Step 2: Submit MFA Code
                const res = await api.post('/auth/login/mfa', { email, password, token: mfaToken });
                login(res.data);
                router.push('/dashboard');
            } else {
                // Step 1: Initial Login
                const res = await api.post('/auth/login', { email, password });

                if (res.data.requiresMfa) {
                    setRequiresMfa(true);
                } else {
                    login(res.data);
                    router.push('/dashboard');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
            if (requiresMfa && err.response?.status === 401) {
                setMfaToken(''); // clear token on failure
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
            <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm border border-neutral-200">
                {!requiresMfa ? (
                    <>
                        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Welcome Back</h1>
                        <p className="text-neutral-500 mb-6 font-medium">Log in to manage your tasks effectively.</p>
                    </>
                ) : (
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-800 mb-2">Two-Factor Auth</h1>
                        <p className="text-neutral-500 font-medium">Enter the 6-digit code from your authenticator app.</p>
                    </div>
                )}

                {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!requiresMfa ? (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-800 mb-1">Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full" placeholder="you@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-neutral-800 mb-1">Password</label>
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full" placeholder="••••••••" />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 text-center">Authenticator Code</label>
                            <input
                                type="text"
                                value={mfaToken}
                                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4"
                                placeholder="000000"
                                autoFocus
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-all shadow-md mt-6 flex justify-center items-center h-[52px]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : requiresMfa ? 'Verify & Login' : 'Log In'}
                    </button>

                    {requiresMfa && (
                        <button type="button" onClick={() => { setRequiresMfa(false); setMfaToken(''); setError(''); }} className="w-full text-sm font-bold text-neutral-500 hover:text-neutral-800 mt-4 transition-colors">
                            Back to Login
                        </button>
                    )}
                </form>

                {!requiresMfa && (
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-neutral-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-neutral-500">Or continue with</span>
                            </div>
                        </div>
                        <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`}
                            className="mt-4 flex items-center justify-center w-full py-2.5 px-4 rounded-lg font-bold text-neutral-700 bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 transition-colors"
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </a>
                    </div>
                )}

                {!requiresMfa && (
                    <p className="mt-6 text-center text-sm text-neutral-600">
                        Don&apos;t have an account? <Link href="/register" className="text-brand-500 font-bold hover:underline">Register now</Link>
                    </p>
                )}
            </div>
        </div>
    );
}
