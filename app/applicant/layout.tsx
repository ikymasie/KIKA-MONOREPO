'use client';

import ApplicantSidebar from '@/components/layout/ApplicantSidebar';
import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ApplicantLayout({
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

        const isApplicant = user?.role === 'society_applicant';
        const isRegulator = [
            'dcd_director', 'dcd_field_officer', 'dcd_compliance_officer',
            'bob_prudential_supervisor', 'bob_financial_auditor', 'bob_compliance_officer'
        ].includes(user?.role || '');
        const isTenantAdmin = [
            'saccos_admin', 'loan_officer', 'accountant', 'member_service_rep', 'credit_committee'
        ].includes(user?.role || '');

        if (!loading && user && !isApplicant && !isRegulator) {
            // Redirect to appropriate portal if they are not an applicant but have another role
            if (isRegulator) {
                router.push('/regulator/dashboard');
            } else if (isTenantAdmin) {
                router.push('/admin/dashboard');
            } else if (user.role === 'member') {
                router.push('/member/dashboard');
            }
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            {/* Sidebar */}
            <div className="w-80 h-full p-4 flex-shrink-0">
                <ApplicantSidebar />
            </div>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-7xl mx-auto h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
