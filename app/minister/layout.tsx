'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import MinisterSidebar from '@/components/layout/MinisterSidebar';
import { useAuth } from '@/lib/auth-hooks';
import { UserRole } from '@/src/entities/User';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function MinisterLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        } else if (!loading && user && user.role !== UserRole.MINISTER_DELEGATE) {
            router.push('/regulator/dashboard');
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== UserRole.MINISTER_DELEGATE) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <DashboardLayout sidebar={<MinisterSidebar />}>
            <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 min-h-full p-8">
                {children}
            </div>
        </DashboardLayout>
    );
}
