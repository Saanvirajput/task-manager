'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

function SSOCallbackHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth(); // Custom login method added to AuthProvider if taking tokens directly, or we handle manual storage

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');

        if (accessToken && refreshToken) {
            // Save tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            // Redirect to dashboard, AuthProvider will re-fetch profile naturally
            router.push('/dashboard');
        } else {
            router.push('/login?error=sso-failed');
        }
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <h1 className="text-xl font-bold text-neutral-800">Completing login...</h1>
                <p className="text-neutral-500 text-sm">Transferring securely to TaskFlow</p>
            </div>
        </div>
    );
}

export default function SSOCallbackPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <SSOCallbackHandler />
        </Suspense>
    );
}
