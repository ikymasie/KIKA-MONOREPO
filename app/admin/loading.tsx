import { SkeletonStats, SkeletonCard, SkeletonTable } from '@/components/common/SkeletonLoader';

export default function AdminLoading() {
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
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-8 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded mb-2" />
                    <div className="h-4 w-96 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
                </div>

                {/* Stats Skeleton */}
                <SkeletonStats count={4} className="mb-8" />

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <SkeletonCard />
                    <SkeletonCard />
                </div>

                {/* Table Skeleton */}
                <div className="card">
                    <div className="h-6 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded mb-6" />
                    <SkeletonTable rows={8} columns={5} />
                </div>
            </div>
        </div>
    );
}
