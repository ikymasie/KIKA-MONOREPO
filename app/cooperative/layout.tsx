'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';
import ApplicantSidebar from '@/components/layout/ApplicantSidebar';

export default function CooperativeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }

        const isApplicant = user?.role === 'cooperative_applicant' || user?.role === 'society_applicant';

        if (!loading && user && !isApplicant) {
            // Redirect to appropriate portal if they are not an applicant
            if (user.role === 'member') {
                router.push('/member/dashboard');
            } else {
                router.push('/dashboard');
            }
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 flex">
            {/* Using the same Sidebar but it can be customized per role if needed */}
            <ApplicantSidebar />

            <main className="flex-1 overflow-y-auto h-screen">
                <div className="p-8 md:p-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
