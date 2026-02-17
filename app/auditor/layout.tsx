import AuditorSidebar from '@/components/layout/AuditorSidebar';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AuditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DashboardLayout sidebar={<AuditorSidebar />}>
            {children}
        </DashboardLayout>
    );
}
