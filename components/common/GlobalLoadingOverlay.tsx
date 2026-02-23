'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const LOADING_MESSAGES = [
    'Preparing your workspace...',
    'Securing connection...',
    'Syncing digital credentials...',
    'Optimizing experience...',
    'Almost there...',
];

export default function GlobalLoadingOverlay() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [messageIndex, setMessageIndex] = useState(0);
    const [visible, setVisible] = useState(false);

    // When route actually changes (page compiled + rendered), hide overlay
    useEffect(() => {
        setIsLoading(false);
    }, [pathname, searchParams]);

    // Fade out effect after loading completes
    useEffect(() => {
        if (!isLoading && visible) {
            const t = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(t);
        }
        if (isLoading) {
            setVisible(true);
        }
    }, [isLoading, visible]);

    // Rotate messages while loading
    useEffect(() => {
        if (!isLoading) return;
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [isLoading]);

    // Global click interceptor — catches any anchor/link navigation
    const handleClick = useCallback(
        (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            // Ignore: external links, hash-only links, javascript:, mailto:, tel:
            if (
                href.startsWith('http') ||
                href.startsWith('//') ||
                href.startsWith('#') ||
                href.startsWith('javascript:') ||
                href.startsWith('mailto:') ||
                href.startsWith('tel:') ||
                anchor.target === '_blank'
            ) {
                return;
            }

            // Ignore if ctrl/cmd/shift click (open in new tab)
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

            // Only show if actually navigating to a different path
            const currentPath = window.location.pathname;
            const targetPath = href.split('?')[0].split('#')[0];
            if (targetPath && targetPath !== currentPath) {
                setMessageIndex(0);
                setIsLoading(true);
            }
        },
        []
    );

    // Also handle programmatic router.push via Next.js router interception
    useEffect(() => {
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [handleClick]);

    // Safety net: force-hide after 8 seconds to prevent stuck loading screens
    useEffect(() => {
        if (!isLoading) return;
        const timeout = setTimeout(() => setIsLoading(false), 8000);
        return () => clearTimeout(timeout);
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-surface-50"
            style={{
                opacity: isLoading ? 1 : 0,
                transition: 'opacity 0.3s ease-out',
                pointerEvents: isLoading ? 'all' : 'none',
            }}
        >
            {/* Animated Background */}
            <div className="animated-bg-wrapper fixed inset-0 z-0 pointer-events-none">
                <div className="animated-bg">
                    <div className="orb orb-1 opacity-20" />
                    <div className="orb orb-2 opacity-20" />
                    <div className="orb orb-3 opacity-20" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-xs w-full px-6">
                {/* Logo */}
                <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-primary-500/20 animate-float">
                        K
                    </div>
                    {/* Pulsing rings */}
                    <div className="absolute inset-0 rounded-2xl border-2 border-primary-400 animate-pulse-glow" />
                    <div className="absolute inset-[-10px] rounded-3xl border border-primary-200/50 animate-pulse-glow delay-200" />
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-4 backdrop-blur-sm border border-white/50">
                    <div
                        className="h-full bg-primary-600 rounded-full animate-shimmer"
                        style={{ width: '100%' }}
                    />
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
