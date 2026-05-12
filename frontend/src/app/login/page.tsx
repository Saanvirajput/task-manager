'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, Loader2 } from 'lucide-react';

// Notion "N" svg logo
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
        const res = await api.post('/auth/login/mfa', { email, password, token: mfaToken });
        login(res.data);
        router.push('/dashboard');
      } else {
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
        setMfaToken('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#FFFFFF' }}
    >
      {/* Card */}
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
        </div>

        {!requiresMfa ? (
          <>
            <h1 className="text-[22px] font-bold text-center mb-1" style={{ color: '#050505', letterSpacing: '-0.01em' }}>
              Log in to TaskFlow
            </h1>
            <p className="text-center text-sm mb-7" style={{ color: '#6B6B6B' }}>
              Your workspace awaits.
            </p>
          </>
        ) : (
          <div className="text-center mb-7">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#EBF5FF' }}
            >
              <ShieldAlert size={26} style={{ color: '#006ADC' }} />
            </div>
            <h1 className="text-[22px] font-bold mb-1" style={{ color: '#050505', letterSpacing: '-0.01em' }}>
              Two-factor auth
            </h1>
            <p className="text-sm" style={{ color: '#6B6B6B' }}>
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>
        )}

        {error && (
          <div
            className="text-sm mb-5 px-3 py-2.5 rounded-md"
            style={{ background: '#FFF0F0', color: '#EB5757', border: '1px solid #FECACA' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {!requiresMfa ? (
            <>
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: '#050505' }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address..."
                  className="w-full"
                  style={{
                    padding: '9px 12px',
                    fontSize: '14px',
                    border: '1px solid #E8E8E8',
                    borderRadius: '6px',
                    color: '#050505',
                    background: '#FFFFFF',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#006ADC';
                    e.target.style.boxShadow = '0 0 0 2px rgba(0,106,220,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8E8E8';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-medium" style={{ color: '#050505' }}>
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password..."
                  className="w-full"
                  style={{
                    padding: '9px 12px',
                    fontSize: '14px',
                    border: '1px solid #E8E8E8',
                    borderRadius: '6px',
                    color: '#050505',
                    background: '#FFFFFF',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#006ADC';
                    e.target.style.boxShadow = '0 0 0 2px rgba(0,106,220,0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E8E8E8';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </>
          ) : (
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2 text-center"
                style={{ color: '#AEACAA' }}
              >
                Authenticator Code
              </label>
              <input
                type="text"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                className="w-full text-center font-mono py-4"
                placeholder="000000"
                autoFocus
                style={{
                  fontSize: '28px',
                  letterSpacing: '0.5em',
                  border: '1px solid #E8E8E8',
                  borderRadius: '6px',
                  outline: 'none',
                  color: '#050505',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#006ADC';
                  e.target.style.boxShadow = '0 0 0 2px rgba(0,106,220,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E8E8E8';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          {/* Primary CTA */}
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
            {loading ? <Loader2 size={18} className="animate-spin" /> : requiresMfa ? 'Verify & Log in' : 'Continue'}
          </button>

          {requiresMfa && (
            <button
              type="button"
              onClick={() => { setRequiresMfa(false); setMfaToken(''); setError(''); }}
              className="w-full text-sm mt-1"
              style={{ color: '#6B6B6B', background: 'none', border: 'none' }}
            >
              ← Back to login
            </button>
          )}
        </form>

        {!requiresMfa && (
          <>
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

            {/* Sign up link */}
            <p className="mt-6 text-center text-sm" style={{ color: '#6B6B6B' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium"
                style={{ color: '#006ADC', textDecoration: 'none' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
              >
                Sign up
              </Link>
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-5 left-0 right-0 text-center text-xs" style={{ color: '#AEACAA' }}>
        <span>By continuing, you agree to our </span>
        <span style={{ color: '#6B6B6B' }}>Terms & Privacy Policy</span>
      </div>
    </div>
  );
}
