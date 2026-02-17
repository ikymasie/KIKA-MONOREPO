'use client';

import { useState, useEffect } from 'react';
import MemberManagement from '@/components/applicant/MemberManagement';
import { useAuth } from '@/lib/auth-hooks';
import { SocietyApplication } from '@/src/entities/SocietyApplication';
import { AlertCircle } from 'lucide-react';

export default function MembersPage() {
    const { user } = useAuth();
    const [application, setApplication] = useState<SocietyApplication | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApp = async () => {
            try {
                const res = await fetch('/api/registration/applications');
                if (res.ok) {
                    const data = await res.json();
                    const app = data.find((a: any) => a.applicantUserId === user?.id);
                    setApplication(app || null);
                }
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchApp();
    }, [user]);

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-3xl" />;

    if (!application) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <AlertCircle size={48} className="text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">No active application found</h2>
                <p className="text-gray-500 mt-2">Please start an application first.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900">{application.proposedName}</h1>
                <p className="text-gray-500 font-medium">Manage your founding members and office bearers.</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 md:p-12 shadow-xl shadow-gray-200/50 border border-gray-100">
                <MemberManagement applicationId={application.id} />
            </div>
        </div>
    );
}
