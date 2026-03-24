'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

function NotionLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="6" fill="black" />
      <path
        d="M8.5 8.5H14.5L22 20.5V11.5H24V23.5H18L10.5 11.5V20.5H8.5V8.5Z"
        fill="white"
      />
    </svg>
  );
}

const inputStyle = {
  padding: '9px 12px',
  fontSize: '14px',
  border: '1px solid #E8E8E8',
  borderRadius: '6px',
  color: '#050505',
  background: '#FFFFFF',
  outline: 'none',
  width: '100%',
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4 select-none">
            <div className="max-w-[400px] w-full p-8 space-y-8">
                <header className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Create account</h1>
                    <p className="text-[var(--secondary-foreground)] text-sm">Join the workspace to start tracking goals.</p>
                </header>

                {error && (
                    <div className="p-3 text-xs bg-red-50 text-red-600 rounded border border-red-100 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1">Full Name</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="notion-input text-sm"
                                    placeholder="Enter your name..."
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1">Email</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="notion-input text-sm"
                                    placeholder="Enter your email..."
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-wider pl-1">Password</label>
                            <div className="p-2 border border-[var(--border)] rounded hover:border-[var(--secondary-foreground)]/30 focus-within:border-[var(--brand)] transition-colors">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="notion-input text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full h-10 bg-[var(--foreground)] text-[var(--background)] font-medium rounded hover:opacity-90 transition-all flex justify-center items-center active:scale-[0.98]"
                    >
                        Sign up
                    </button>
                </form>

                <div className="space-y-6 pt-4">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--border)]"></div>
                        </div>
                        <div className="relative flex justify-center text-[11px] uppercase tracking-widest">
                            <span className="px-3 bg-[var(--background)] text-[var(--secondary-foreground)]">or</span>
                        </div>
                    </div>

                    <a
                        href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`}
                        className="flex items-center justify-center w-full h-10 rounded border border-[var(--border)] hover:bg-[var(--hover)] transition-colors font-medium text-[13px] text-[var(--foreground)] gap-2 active:scale-[0.98]"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </a>

                    <p className="text-center text-[13px] text-[var(--secondary-foreground)]">
                        Already have an account? <Link href="/login" className="text-[var(--foreground)] font-semibold hover:underline decoration-[var(--border)] underline-offset-4">Log in</Link>
                    </p>
                </div>
            </div>
=======
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#006ADC';
    e.target.style.boxShadow = '0 0 0 2px rgba(0,106,220,0.12)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#E8E8E8';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FFFFFF' }}>
      <div
        className="w-full max-w-[420px] py-10 px-9"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          borderRadius: '8px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-7">
          <NotionLogo size={36} />
>>>>>>> development
        </div>

        <h1 className="text-[22px] font-bold text-center mb-1" style={{ color: '#050505', letterSpacing: '-0.01em' }}>
          Create your account
        </h1>
        <p className="text-center text-sm mb-7" style={{ color: '#6B6B6B' }}>
          Join TaskFlow and start organizing your work.
        </p>

        {error && (
          <div
            className="text-sm mb-5 px-3 py-2.5 rounded-md"
            style={{ background: '#FFF0F0', color: '#EB5757', border: '1px solid #FECACA' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#050505' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your full name"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#050505' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address..."
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#050505' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Choose a strong password..."
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center h-[40px] text-white text-sm font-medium mt-2"
            style={{
              background: loading ? '#4DA3F5' : '#006ADC',
              borderRadius: '6px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { if (!loading) (e.target as HTMLElement).style.background = '#0057B3'; }}
            onMouseLeave={(e) => { if (!loading) (e.target as HTMLElement).style.background = '#006ADC'; }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full" style={{ borderTop: '1px solid #E8E8E8' }} />
          </div>
          <div className="relative flex justify-center text-xs" style={{ color: '#AEACAA' }}>
            <span className="px-2 bg-white">OR</span>
          </div>
        </div>

        {/* Google OAuth */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`}
          className="flex items-center justify-center w-full h-[40px] text-sm font-medium"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E8E8E8',
            borderRadius: '6px',
            color: '#050505',
            textDecoration: 'none',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F7F6F3')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
        >
          <svg className="w-4 h-4 mr-2.5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </a>

        <p className="mt-6 text-center text-sm" style={{ color: '#6B6B6B' }}>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium"
            style={{ color: '#006ADC', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Log in
          </Link>
        </p>
      </div>

      <div className="fixed bottom-5 left-0 right-0 text-center text-xs" style={{ color: '#AEACAA' }}>
        <span>By continuing, you agree to our </span>
        <span style={{ color: '#6B6B6B' }}>Terms & Privacy Policy</span>
      </div>
    </div>
  );
}
