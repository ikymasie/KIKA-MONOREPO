import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import MemberOnboardingWizard from '@/components/admin/MemberOnboardingWizard';

export default function NewMemberPage() {
    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Member Onboarding</h1>
                    <p className="text-gray-600 mt-1">Guided process to register and verify a new SACCOS member.</p>
                </div>
                <MemberOnboardingWizard />
            </div>
        </DashboardLayout>
    );
}
