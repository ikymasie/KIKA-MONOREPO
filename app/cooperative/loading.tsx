import { SkeletonForm, SkeletonCard } from '@/components/common/SkeletonLoader';

export default function CooperativeLoading() {
    return (
        <div className="min-h-screen bg-surface-50">
            {/* Animated Background */}
            <div className="animated-bg-wrapper fixed inset-0 z-0 pointer-events-none">
                <div className="animated-bg">
                    <div className="orb orb-1 opacity-10"></div>
                    <div className="orb orb-2 opacity-10"></div>
                    <div className="orb orb-3 opacity-10"></div>
                </div>
            </div>

            <div className="relative z-10 p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header Skeleton */}
                    <div className="mb-8">
                        <div className="h-8 w-96 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded mb-2" />
                        <div className="h-4 w-full max-w-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                    </div>

                    {/* Progress Steps Skeleton */}
                    <div className="flex justify-between mb-8">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
                                <div className="h-3 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Form Skeleton */}
                    <div className="card">
                        <SkeletonForm fields={6} />
                    </div>
                </div>
            </div>
        </div>
    );
}
