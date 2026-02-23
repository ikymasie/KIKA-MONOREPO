'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-hooks';
import { getRoleBasedRoute } from '@/lib/route-utils';
import Image from 'next/image';
import Link from 'next/link';

function AdminSignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn } = useAuth();

    const rawCallbackUrl = searchParams.get('callbackUrl');
    // Validate callbackUrl: only allow internal page routes (not API routes or external URLs)
    const callbackUrl = (() => {
        if (!rawCallbackUrl) return null;
        try {
            const url = new URL(rawCallbackUrl, 'http://localhost');
            const pathname = url.pathname;
            if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) return null;
            return pathname;
        } catch {
            return null;
        }
    })();

    const handleEmailSignIn = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userCredential = await signIn(email, password);
            const idToken = await userCredential.user.getIdToken();

            const response = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create session');
            }

            const { user: userData } = await response.json();
            toast.success('Signed in successfully');

            if (callbackUrl && callbackUrl !== '/') {
                router.push(callbackUrl);
            } else {
                const route = getRoleBasedRoute(userData.role);
                router.push(route);
            }
        } catch (err: any) {
            console.error('Admin sign in error:', err);
            toast.error(err.message || 'Failed to sign in');
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
                        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            Administrator Access
                        </div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-secondary-700 mb-2">
                            Admin Sign In
                        </h1>
                        <p className="text-gray-600 font-medium">
                            SACCOS Back-Office Portal
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleEmailSignIn} className="space-y-5 animate-reveal-up delay-200">
                        <div>
                            <label htmlFor="email" className="label">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="input"
                                placeholder="admin@kika.bw"
                                autoComplete="email"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="label">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="input"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary mt-2"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-gray-500 border-t border-gray-200/50 pt-6 animate-reveal-up delay-400">
                        <p>Are you a member?{' '}
                            <Link href="/auth/signin" className="font-semibold text-primary-600 hover:underline">
                                Member sign in →
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

export default function AdminSignInPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading admin portal...</p>
                </div>
            </div>
        }>
            <AdminSignInForm />
        </Suspense>
    );
}
