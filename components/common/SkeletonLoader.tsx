import React from 'react';

interface SkeletonProps {
    className?: string;
}

// Base skeleton element with shimmer animation
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded ${className}`}
            aria-hidden="true"
        />
    );
}

// Skeleton for text content
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

// Skeleton for avatar/profile images
export function SkeletonAvatar({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-16 h-16',
    };

    return <Skeleton className={`${sizeClasses[size]} rounded-full ${className}`} />;
}

// Skeleton for card layouts
export function SkeletonCard({ className = '' }: SkeletonProps) {
    return (
        <div className={`card ${className}`}>
            <div className="flex items-start gap-4">
                <SkeletonAvatar size="lg" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <SkeletonText lines={2} />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24 rounded-xl" />
                    <Skeleton className="h-9 w-24 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

// Skeleton for table rows
export function SkeletonTable({ rows = 5, columns = 4, className = '' }: { rows?: number; columns?: number; className?: string }) {
    return (
        <div className={`space-y-3 ${className}`}>
            {/* Table header */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-5 w-3/4" />
                ))}
            </div>

            {/* Table rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div
                    key={`row-${rowIndex}`}
                    className="grid gap-4 py-3 border-t border-gray-100"
                    style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                >
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 w-full" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// Skeleton for dashboard stats/metrics
export function SkeletonStats({ count = 4, className = '' }: { count?: number; className?: string }) {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card">
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-8 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
            ))}
        </div>
    );
}

// Skeleton for form inputs
export function SkeletonForm({ fields = 5, className = '' }: { fields?: number; className?: string }) {
    return (
        <div className={`space-y-6 ${className}`}>
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-11 w-full rounded-xl" />
                </div>
            ))}
        </div>
    );
}
