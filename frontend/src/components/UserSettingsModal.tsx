import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, ShieldAlert, ShieldCheck, Loader2, Calendar } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
    const { user } = useAuth();
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [mfaToken, setMfaToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
    const [isGoogleLinked, setIsGoogleLinked] = useState(false);

    useEffect(() => {
        const fetchMfaStatus = async () => {
            if (!isOpen) return;
            try {
                const res = await api.get('/auth/me');
                setMfaEnabled(res.data.mfaEnabled);
                setCalendarSyncEnabled(res.data.calendarSyncEnabled);
                setIsGoogleLinked(!!res.data.googleId);
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
            }
        };

        if (isOpen) {
            fetchMfaStatus();
        } else {
            setQrCodeUrl(null);
            setSecret(null);
            setMfaToken('');
            setError('');
            setSuccess('');
        }
    }, [isOpen]);

    const handleSetupMfa = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.post('/auth/mfa/setup');
            setQrCodeUrl(res.data.qrCodeUrl);
            setSecret(res.data.secret);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to initiate MFA setup.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/mfa/verify', { token: mfaToken });
            setSuccess('MFA successfully enabled! You will need to use it next time you log in.');
            setMfaEnabled(true);
            setQrCodeUrl(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid code.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCalendarSync = async () => {
        setLoading(true);
        try {
            const res = await api.put('/auth/calendar-sync', { enabled: !calendarSyncEnabled });
            setCalendarSyncEnabled(res.data.enabled);
            setSuccess(`Calendar sync ${res.data.enabled ? 'enabled' : 'disabled'} successfully.`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update calendar sync.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
            <div className="bg-white shadow-2xl max-w-md w-full border border-[var(--border)] overflow-hidden flex flex-col max-h-[90vh] rounded-lg">
                <div className="flex justify-between items-center p-8 border-b border-[var(--border)]">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Settings</h2>
                        <p className="text-[10px] text-[var(--secondary-foreground)] font-bold uppercase tracking-widest mt-1">Manage your workspace account</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--hover)] rounded transition-colors text-[var(--secondary-foreground)]">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-8 no-scrollbar">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded border border-red-100 text-xs font-medium">{error}</div>}
                    {success && <div className="p-3 bg-green-50 text-green-700 rounded border border-green-100 text-xs font-medium flex items-center gap-2"><ShieldCheck size={16} /> {success}</div>}

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-[var(--hover)] p-2 rounded">
                                <ShieldAlert size={18} className="text-[var(--foreground)]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm text-[var(--foreground)] uppercase tracking-tight">Two-Factor Security</h3>
                                <p className="text-[11px] text-[var(--secondary-foreground)] mt-1 font-medium leading-relaxed">Secure your workspace using a TOTP authenticator app.</p>
                            </div>
                        </div>

                        <div className="p-4 border border-[var(--border)] rounded bg-[var(--background)]">
                            {!qrCodeUrl && !mfaEnabled && !success && (
                                <button
                                    onClick={handleSetupMfa}
                                    disabled={loading}
                                    className="w-full h-10 bg-[var(--foreground)] text-[var(--background)] font-bold rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest active:scale-[0.98]"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Activate MFA'}
                                </button>
                            )}

                            {mfaEnabled || success ? (
                                <div className="flex items-center gap-3 text-green-600 font-bold text-xs uppercase tracking-widest py-2">
                                    <ShieldCheck size={18} />
                                    Active Deployment Security
                                </div>
                            ) : qrCodeUrl ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col items-center p-4 border border-[var(--border)] rounded bg-white">
                                        <p className="text-[10px] font-bold text-[var(--secondary-foreground)] uppercase tracking-widest mb-4">Scan QR Protocol</p>
                                        <img src={qrCodeUrl} alt="MFA QR Code" className="w-40 h-40 grayscale hover:grayscale-0 transition-all duration-700" />
                                        <div className="mt-6 text-center w-full">
                                            <p className="text-[9px] text-[var(--secondary-foreground)] font-bold uppercase tracking-widest mb-2">Manual Override Key</p>
                                            <code className="bg-[var(--background)] px-3 py-2 rounded border border-[var(--border)] text-[11px] font-mono font-bold text-[var(--foreground)] block tracking-widest select-all">{secret}</code>
                                        </div>
                                    </div>

                                    <form onSubmit={handleVerifyMfa} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-[var(--secondary-foreground)] uppercase tracking-widest pl-1 font-mono">Verify Component Code</label>
                                            <input
                                                type="text"
                                                placeholder="000 000"
                                                required
                                                value={mfaToken}
                                                onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-4 border border-[var(--border)] rounded focus:border-[var(--brand)] outline-none"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading || mfaToken.length < 6}
                                            className="w-full h-11 bg-[var(--foreground)] text-[var(--background)] disabled:opacity-30 font-bold rounded hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs active:scale-[0.98]"
                                        >
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Activation'}
                                        </button>
                                    </form>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-[var(--hover)] p-2 rounded">
                                <Calendar size={18} className="text-[var(--foreground)]" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-sm text-[var(--foreground)] uppercase tracking-tight">Google Calendar Link</h3>
                                <p className="text-[11px] text-[var(--secondary-foreground)] mt-1 font-medium leading-relaxed">Sync tasks with deadlines to your primary calendar.</p>
                            </div>
                        </div>

                        <div className="p-4 border border-[var(--border)] rounded bg-[var(--background)]">
                            {!isGoogleLinked ? (
                                <div className="space-y-4">
                                    <p className="text-[11px] text-amber-600 font-bold uppercase tracking-widest">Protocol Required</p>
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                                        className="w-full h-10 border border-[var(--border)] bg-white text-[var(--foreground)] text-[11px] font-bold rounded hover:bg-[var(--hover)] transition-all flex items-center justify-center uppercase tracking-widest"
                                    >
                                        Establish Google Link
                                    </a>
                                </div>
                            ) : (
                                <button
                                    onClick={handleToggleCalendarSync}
                                    disabled={loading}
                                    className={`w-full h-10 text-[11px] font-bold rounded transition-all flex items-center justify-center gap-2 border uppercase tracking-widest active:scale-[0.98] ${calendarSyncEnabled
                                        ? 'bg-white border-[var(--foreground)] text-[var(--foreground)]'
                                        : 'bg-[var(--foreground)] text-[var(--background)]'
                                        }`}
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : calendarSyncEnabled ? 'Disconnect Sync' : 'Initialize Sync'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
