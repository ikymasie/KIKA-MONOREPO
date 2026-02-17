'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useAuth } from '@/lib/auth-hooks';
import { UserRole } from '@/src/entities/User';
import LoanOfficerDashboardContent from '@/components/admin/LoanOfficerDashboardContent';
import SaccosAdminDashboardContent from '@/components/admin/SaccosAdminDashboardContent';

export default function AdminDashboard() {
    const { user } = useAuth();

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                {user?.role === UserRole.LOAN_OFFICER ? (
                    <LoanOfficerDashboardContent />
                ) : (
                    <SaccosAdminDashboardContent />
                )}
            </div>
        </DashboardLayout>
    );
}
