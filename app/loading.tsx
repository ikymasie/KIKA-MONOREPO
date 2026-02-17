'use client';

import { useEffect, useState } from 'react';

const LOADING_MESSAGES = [
    "Preparing your workspace...",
    "Securing connection...",
    "Syncing digital credentials...",
    "Optimizing experience...",
    "Almost there..."
];

export default function Loading() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface-50">
            {/* Animated Background */}
            <div className="animated-bg-wrapper fixed inset-0 z-0 pointer-events-none">
                <div className="animated-bg">
                    <div className="orb orb-1 opacity-20"></div>
                    <div className="orb orb-2 opacity-20"></div>
                    <div className="orb orb-3 opacity-20"></div>
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-xs w-full px-6">
                {/* Logo Spinner */}
                <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-primary-500/20 animate-float">
                        K
                    </div>
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary-400 animate-pulse-glow"></div>
                    <div className="absolute inset-[-10px] rounded-3xl border border-indigo-200/50 animate-pulse-glow delay-200"></div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4 backdrop-blur-sm border border-white/50">
                    <div className="h-full bg-primary-600 rounded-full animate-shimmer" style={{ width: '100%' }}></div>
                </div>

                {/* Dynamic Message */}
                <p className="text-gray-600 font-bold text-sm tracking-wide text-center animate-fade-in animate-pulse">
                    {LOADING_MESSAGES[messageIndex]}
                </p>

                <p className="mt-2 text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em] animate-fade-in delay-200">
                    KIKA DIGITAL PLATFORM
                </p>
            </div>
        </div>
    );
}
