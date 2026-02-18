'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/src/entities/User';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
import {
    Users,
    Building2,
    ArrowRight,
    ArrowLeft,
    Check,
    ShieldCheck,
    Mail,
    Lock,
    User as UserIcon,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';

type SignupStep = 'role-selection' | 'account-setup';

const PROCESSING_STAGES = [
    { title: 'Creating Security Context', description: 'Setting up encrypted credentials...' },
    { title: 'Cloud Sync', description: 'Provisioning authentication...' },
    { title: 'Database Entry', description: 'Registering your organisation profile...' },
    { title: 'Portal Ready', description: 'Taking you to your dashboard...' }
];

export default function SignupPage() {
    const [step, setStep] = useState<SignupStep>('role-selection');
    const [prevStep, setPrevStep] = useState<SignupStep | null>(null);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);
    const [processingStage, setProcessingStage] = useState(0);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
    });

    const router = useRouter();

    const handleRoleSelect = (role: UserRole) => {
        setPrevStep('role-selection');
        setSelectedRole(role);
        setStep('account-setup');
    };

    const handleBack = () => {
        setPrevStep('account-setup');
        setStep('role-selection');
    };

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setProcessingStage(0);

        // Simulate multi-stage progress for high-end feel
        const stageInterval = setInterval(() => {
            setProcessingStage(prev => (prev < 3 ? prev + 1 : prev));
        }, 1500);

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    role: selectedRole,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                clearInterval(stageInterval);
                throw new Error(data.error || 'Failed to create account');
            }

            const { customToken } = data;

            // Stage: Cloud Sync
            setProcessingStage(1);
            const userCredential = await signInWithCustomToken(auth, customToken);
            const idToken = await userCredential.user.getIdToken();

            // Stage: Database Session
            setProcessingStage(2);
            const sessionResponse = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
            });

            if (!sessionResponse.ok) {
                clearInterval(stageInterval);
                throw new Error('Failed to create session');
            }

            // Stage: Finalizing
            setProcessingStage(3);
            setTimeout(() => {
                router.push('/applicant');
            }, 1000);

        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to create account');
            setLoading(false);
            clearInterval(stageInterval);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-12 overflow-hidden bg-surface-50">
            {/* Animated Background */}
            <div className="animated-bg-wrapper fixed inset-0 z-0 pointer-events-none">
                <div className="animated-bg">
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                    <div className="orb orb-3"></div>
                </div>
            </div>

            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <div className="w-full max-w-2xl relative z-10">
                {loading ? (
                    <div className="glass-panel p-12 shadow-2xl border-white/40 text-center animate-scale-in">
                        <div className="relative mb-10 inline-block">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl animate-float shadow-lg shadow-primary-500/20">
                                K
                            </div>
                            <div className="absolute inset-0 rounded-2xl border-2 border-primary-500 animate-pulse-glow"></div>
                        </div>

                        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
                            {PROCESSING_STAGES[processingStage].title}
                        </h2>
                        <p className="text-gray-500 font-medium mb-10">
                            {PROCESSING_STAGES[processingStage].description}
                        </p>

                        <div className="max-w-xs mx-auto">
                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                                <div
                                    className="h-full bg-primary-600 transition-all duration-1000 ease-out animate-shimmer"
                                    style={{ width: `${(processingStage + 1) * 25}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between mt-3 px-1">
                                {PROCESSING_STAGES.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-colors duration-500 ${i <= processingStage ? 'bg-primary-500 shadow-glow' : 'bg-gray-200'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="glass-panel p-8 md:p-12 shadow-2xl border-white/40 animate-scale-in">
                        {/* Header */}
                        <div className="text-center mb-10 animate-fade-in-down">
                            <Link href="/" className="inline-flex h-12 w-12 mb-6 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 items-center justify-center text-white font-bold text-2xl shadow-lg hover:scale-110 transition-transform">
                                K
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2 drop-shadow-sm">Register Your Organisation</h1>
                            <p className="text-gray-500 font-medium">Start your digital transformation journey with KIKA</p>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center justify-center gap-4 mb-12 animate-reveal-up delay-100">
                            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-500 ${step === 'role-selection' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'bg-green-100 text-green-700'}`}>
                                {step === 'role-selection' ? (
                                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                                ) : (
                                    <Check size={16} className="animate-scale-in" />
                                )}
                                Organisation Type
                            </div>
                            <div className={`w-12 h-[2px] transition-colors duration-500 ${step === 'account-setup' ? 'bg-primary-600' : 'bg-gray-200'}`} />
                            <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-500 ${step === 'account-setup' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'bg-gray-100 text-gray-400 opacity-60'}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 'account-setup' ? 'bg-white/20' : 'bg-gray-300'}`}>2</span>
                                Account Setup
                            </div>
                        </div>

                        {error && (
                            <div className="mb-8 p-5 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl animate-shake flex items-start gap-3">
                                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-red-600 font-bold">{error}</p>
                            </div>
                        )}

                        <div className="relative overflow-hidden min-h-[400px]">
                            {step === 'role-selection' ? (
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* SACCO / Co-operative card — slides in from left */}
                                    <button
                                        onClick={() => handleRoleSelect(UserRole.COOPERATIVE_APPLICANT)}
                                        className="group relative p-8 rounded-[40px] bg-white/60 border-2 border-white/50 hover:border-primary-500 hover:bg-white/90 transition-all text-left shadow-sm hover:shadow-2xl hover:-translate-y-2 backdrop-blur-md animate-slide-in-left"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                            <Building2 size={32} />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mb-2">SACCO / Co-operative</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed font-semibold">For saving and credit societies, agricultural co-ops, and financial co-operatives.</p>
                                        <div className="mt-8 inline-flex items-center text-primary-600 font-black text-sm uppercase tracking-wider group-hover:gap-3 gap-2 transition-all">
                                            Select &amp; Continue <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>

                                    {/* General Society card — slides in from right */}
                                    <button
                                        onClick={() => handleRoleSelect(UserRole.SOCIETY_APPLICANT)}
                                        className="group relative p-8 rounded-[40px] bg-white/60 border-2 border-white/50 hover:border-indigo-500 hover:bg-white/90 transition-all text-left shadow-sm hover:shadow-2xl hover:-translate-y-2 backdrop-blur-md animate-slide-in-right"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                                            <Users size={32} />
                                        </div>
                                        <h3 className="text-2xl font-black text-gray-900 mb-2">General Society</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed font-semibold">For burial societies, social clubs, professional associations, and NGOs.</p>
                                        <div className="mt-8 inline-flex items-center text-indigo-600 font-black text-sm uppercase tracking-wider group-hover:gap-3 gap-2 transition-all">
                                            Select &amp; Continue <ArrowRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSignup} className="space-y-6 animate-slide-in-right">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="group animate-reveal-up delay-100">
                                            <label className="label flex items-center gap-2 group-focus-within:text-primary-600 transition-colors">
                                                <UserIcon size={16} />
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                className="input text-lg font-medium"
                                                placeholder="John"
                                                value={formData.firstName}
                                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                            />
                                        </div>
                                        <div className="group animate-reveal-up delay-200">
                                            <label className="label">Last Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="input text-lg font-medium"
                                                placeholder="Doe"
                                                value={formData.lastName}
                                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="group animate-reveal-up delay-300">
                                        <label className="label flex items-center gap-2 group-focus-within:text-primary-600 transition-colors">
                                            <Mail size={16} />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            className="input text-lg font-medium"
                                            placeholder="john.doe@example.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="group animate-reveal-up delay-400">
                                            <label className="label flex items-center gap-2 group-focus-within:text-primary-600 transition-colors">
                                                <Lock size={16} />
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                required
                                                className="input text-lg font-medium"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                        <div className="group animate-reveal-up delay-500">
                                            <label className="label">Confirm Password</label>
                                            <input
                                                type="password"
                                                required
                                                className="input text-lg font-medium"
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 flex flex-col md:flex-row gap-4 animate-reveal-up delay-600">
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="px-8 py-5 bg-gray-100 text-gray-700 font-extrabold rounded-[20px] hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft size={20} />
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-gradient-to-r from-primary-600 to-indigo-700 text-white font-black text-lg py-5 rounded-[20px] shadow-2xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                                        >
                                            Create Account &amp; Start Process
                                            <ShieldCheck size={22} className="group-hover:scale-125 transition-transform" />
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="mt-12 text-center pt-8 border-t border-gray-100/50 animate-reveal-up delay-700">
                            <p className="text-gray-500 font-semibold">
                                Already have an account?{' '}
                                <Link href="/auth/signin" className="text-primary-600 font-black hover:underline hover:text-primary-700 transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                )}

                <p className="mt-8 text-center text-sm font-medium text-gray-400 animate-reveal-up delay-800">
                    By registering, you agree to our <span className="text-gray-600 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-gray-600 hover:underline cursor-pointer">Privacy Policy</span>.
                </p>
            </div>
        </div>
    );
}
