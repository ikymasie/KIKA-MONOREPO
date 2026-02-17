'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import DirectorSidebar from '@/components/layout/DirectorSidebar';
import { useAuth } from '@/lib/auth-hooks';
import { UserRole } from '@/src/entities/User';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DirectorLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        } else if (!loading && user && user.role !== UserRole.DIRECTOR_COOPERATIVES) {
            router.push('/regulator/dashboard');
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== UserRole.DIRECTOR_COOPERATIVES) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <DashboardLayout sidebar={<DirectorSidebar />}>
            {children}
        </DashboardLayout>
    );
}
