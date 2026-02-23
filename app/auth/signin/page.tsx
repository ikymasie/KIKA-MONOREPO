'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import { getRoleBasedRoute } from '@/lib/route-utils';
import Image from 'next/image';
import Link from 'next/link';

function MemberSignInForm() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const rawCallbackUrl = searchParams.get('callbackUrl');
    // Validate callbackUrl: only allow internal page routes (not API routes or external URLs)
    const callbackUrl = (() => {
        if (!rawCallbackUrl) return null;
        try {
            // Reject external URLs
            const url = new URL(rawCallbackUrl, 'http://localhost');
            const pathname = url.pathname;
            // Reject API routes and Next.js internal routes
            if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return null;
            return pathname;
        } catch {
            return null;
        }
    })();

    const handleSendOtp = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setOtpSent(true);
            toast.success('Verification code sent');
        } catch (err: any) {
            console.error('Send OTP error:', err);
            toast.error(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/otp/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code: otp }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to verify OTP');
            }

            const { customToken } = data;

            // Sign in with Firebase using custom token
            const userCredential = await signInWithCustomToken(auth, customToken);

            // Get ID token for session creation
            const idToken = await userCredential.user.getIdToken();

            // Call backend to create session
            const sessionResponse = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!sessionResponse.ok) {
                const sessionData = await sessionResponse.json();
                throw new Error(sessionData.error || 'Failed to create session');
            }

            const { user: userData } = await sessionResponse.json();
            toast.success('Signed in successfully');

            if (callbackUrl && callbackUrl !== '/') {
                router.push(callbackUrl);
            } else {
                const route = getRoleBasedRoute(userData.role);
                router.push(route);
            }
        } catch (err: any) {
            console.error('Verify OTP error:', err);
            toast.error(err.message || 'Failed to verify OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-surface-50">
            {/* Animated Background */}
            <div className="animated-bg-wrapper fixed inset-0 z-0 pointer-events-none">
                <div className="animated-bg">
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                    <div className="orb orb-3"></div>
                </div>
            </div>

            {/* Mesh Overlay */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Card */}
            <div className="w-full max-w-md relative z-10 animate-scale-in">
                <div className="glass-panel p-8 md:p-10 shadow-2xl shadow-indigo-500/10 border-white/40">
                    {/* Header */}
                    <div className="text-center mb-8 animate-fade-in-down">
                        <div className="inline-flex mb-6 items-center justify-center">
                            <Image
                                src="/assets/logos/kika-logo.png"
                                alt="KIKA"
                                width={120}
                                height={48}
                                className="h-14 w-auto object-contain"
                                priority
                            />
                        </div>
                        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                            Member Access
                        </div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-secondary-700 mb-2">
                            Member Sign In
                        </h1>
                        <p className="text-gray-600 font-medium">
                            Member Self-Service Portal
                        </p>
                    </div>

                    {/* OTP Flow */}
                    <div className="space-y-6 animate-reveal-up delay-200">
                        {!otpSent ? (
                            <form onSubmit={handleSendOtp} className="space-y-5">
                                <div>
                                    <label htmlFor="phone" className="label">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium z-10">+267</span>
                                        <input
                                            id="phone"
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            disabled={loading}
                                            className="input pl-16 text-lg tracking-wide"
                                            placeholder="71 234 567"
                                            autoComplete="tel"
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 ml-1">We will send a 6-digit verification code to your phone</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn btn-primary mt-2"
                                >
                                    {loading ? 'Sending Code...' : 'Send Verification Code'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-reveal-up">
                                <div className="bg-primary-50/50 border border-primary-100 p-4 rounded-xl mb-4 text-sm text-primary-700 flex justify-between items-center backdrop-blur-sm">
                                    <span>Code sent to <strong>+267 {phone}</strong></span>
                                    <button
                                        type="button"
                                        onClick={() => setOtpSent(false)}
                                        className="text-primary-600 font-bold hover:underline"
                                    >
                                        Change
                                    </button>
                                </div>
                                <div>
                                    <label htmlFor="otp" className="label text-center">
                                        Verification Code
                                    </label>
                                    <input
                                        id="otp"
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        required
                                        disabled={loading}
                                        className="input text-center text-3xl tracking-[0.5em] font-bold h-16"
                                        placeholder="------"
                                        autoComplete="one-time-code"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full btn btn-primary py-3 text-lg"
                                >
                                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                                </button>
                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={handleSendOtp}
                                        disabled={loading}
                                        className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
                                    >
                                        Didn&apos;t receive code? Resend
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-gray-500 border-t border-gray-200/50 pt-6 animate-reveal-up delay-400">
                        <p>Are you an administrator?{' '}
                            <Link href="/auth/admin/signin" className="font-semibold text-primary-600 hover:underline">
                                Admin sign in →
                            </Link>
                        </p>
                        <p className="mt-3">Need help accessing your account?</p>
                        <p className="mt-1 font-medium text-primary-600">Contact your Society Support Team</p>
                    </div>
                </div>

                <div className="mt-8 text-center animate-reveal-up delay-500">
                    <a href="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 backdrop-blur-sm border border-white/20">
                        <span>←</span> Back to home
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function MemberSignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading member portal...</p>
                </div>
            </div>
        }>
            <MemberSignInForm />
        </Suspense>
    );
}
