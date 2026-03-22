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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-neutral-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-neutral-800">User Settings</h2>
                        <p className="text-sm text-neutral-500 font-medium">Manage your personal account details</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition-colors text-neutral-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {error && <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm border border-red-100">{error}</div>}
                    {success && <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-100 flex items-center gap-2"><ShieldCheck size={16} /> {success}</div>}

                    <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-800">Two-Factor Authentication</h3>
                                <p className="text-xs text-neutral-500 mt-1">Add an extra layer of security to your TaskFlow Enterprise account using a TOTP authenticator app.</p>
                            </div>
                        </div>

                        {!qrCodeUrl && !mfaEnabled && !success && (
                            <button
                                onClick={handleSetupMfa}
                                disabled={loading}
                                className="w-full py-2 bg-neutral-900 hover:bg-black text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Enable MFA'}
                            </button>
                        )}

                        {mfaEnabled || success ? (
                            <div className="text-center py-4 bg-green-50 rounded-lg text-green-700 font-bold border border-green-100">
                                <ShieldCheck size={24} className="mx-auto mb-2" />
                                MFA is Currently Enabled
                            </div>
                        ) : qrCodeUrl ? (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex flex-col items-center bg-neutral-50 p-4 rounded-lg border border-neutral-200 mb-4">
                                    <p className="text-sm font-bold text-neutral-800 mb-2">1. Scan this QR Code</p>
                                    <img src={qrCodeUrl} alt="MFA QR Code" className="w-48 h-48 rounded-lg bg-white p-2 shadow-sm border border-neutral-100" />
                                    <div className="mt-4 text-center">
                                        <p className="text-xs text-neutral-500 font-medium">Or enter code manually:</p>
                                        <code className="bg-white px-2 py-1 rounded border border-neutral-200 text-xs font-bold text-neutral-800 mt-1 block tracking-widest">{secret}</code>
                                    </div>
                                </div>

                                <form onSubmit={handleVerifyMfa}>
                                    <label className="block text-sm font-bold text-neutral-800 mb-2">2. Verify Code</label>
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        required
                                        value={mfaToken}
                                        onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 ring-1 ring-neutral-200 rounded-lg focus:ring-indigo-500 outline-none mb-4"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || mfaToken.length < 6}
                                        className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Enable'}
                                    </button>
                                </form>
                            </div>
                        ) : null}
                    </div>

                    {/* Google Calendar Sync Section */}
                    <div className="border border-neutral-200 rounded-xl p-5 bg-white shadow-sm">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                                <Calendar size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-neutral-800">Google Calendar Sync</h3>
                                <p className="text-xs text-neutral-500 mt-1">Automatically sync your tasks with deadlines to your Google Calendar.</p>
                            </div>
                        </div>

                        {!isGoogleLinked ? (
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex flex-col gap-2">
                                <p className="text-xs text-amber-700 font-bold">Account not linked with Google.</p>
                                <a
                                    href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                                    className="text-center py-2 bg-white border border-amber-200 text-amber-700 text-xs font-black rounded-lg hover:bg-amber-100 transition-colors"
                                >
                                    Link Google Account
                                </a>
                            </div>
                        ) : (
                            <button
                                onClick={handleToggleCalendarSync}
                                disabled={loading}
                                className={`w-full py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-2 border ${calendarSyncEnabled
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                                    : 'bg-neutral-900 hover:bg-black text-white'
                                    }`}
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : calendarSyncEnabled ? 'Disable Sync' : 'Enable Sync'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
