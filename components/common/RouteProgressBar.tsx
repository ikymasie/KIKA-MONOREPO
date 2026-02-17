'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function RouteProgressBar() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Start loading animation when route changes
        setIsLoading(true);
        setProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, 100);

        // Complete loading after a short delay
        const timeout = setTimeout(() => {
            setProgress(100);
            setTimeout(() => {
                setIsLoading(false);
                setProgress(0);
            }, 200);
        }, 500);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [pathname, searchParams]);

    if (!isLoading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[10000] h-1">
            <div
                className="h-full bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-600 transition-all duration-300 ease-out shadow-lg shadow-primary-500/50"
                style={{
                    width: `${progress}%`,
                    transition: progress === 100 ? 'width 0.2s ease-out' : 'width 0.3s ease-out',
                }}
            />
        </div>
    );
}
