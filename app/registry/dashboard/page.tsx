'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';

interface RegistryStats {
    newSubmissions: number;
    incomplete: number;
    underReview: number;
    totalActive: number;
}

export default function RegistryDashboard() {
    const [stats, setStats] = useState<RegistryStats>({
        newSubmissions: 0,
        incomplete: 0,
        underReview: 0,
        totalActive: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/registration/applications');
                if (res.ok) {
                    const apps = await res.json();
                    setStats({
                        newSubmissions: apps.filter((a: any) => a.status === 'submitted').length,
                        incomplete: apps.filter((a: any) => a.status === 'incomplete').length,
                        underReview: apps.filter((a: any) => a.status === 'under_review').length,
                        totalActive: apps.length
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Registry Workspace</h1>
                    <p className="text-gray-600 mt-2">Manage application intake and document verification.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card p-6 border-l-4 border-primary-500">
                        <div className="text-sm font-medium text-gray-500 uppercase">New Submissions</div>
                        <div className="text-3xl font-bold text-primary-600 mt-1">{stats.newSubmissions}</div>
                    </div>
                    <div className="card p-6 border-l-4 border-warning-500">
                        <div className="text-sm font-medium text-gray-500 uppercase">Incomplete</div>
                        <div className="text-3xl font-bold text-warning-600 mt-1">{stats.incomplete}</div>
                    </div>
                    <div className="card p-6 border-l-4 border-secondary-500">
                        <div className="text-sm font-medium text-gray-500 uppercase">Under Review</div>
                        <div className="text-3xl font-bold text-secondary-600 mt-1">{stats.underReview}</div>
                    </div>
                    <div className="card p-6 border-l-4 border-blue-500">
                        <div className="text-sm font-medium text-gray-500 uppercase">Total Active</div>
                        <div className="text-3xl font-bold text-blue-600 mt-1">{stats.totalActive}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">Quick Intake Actions</h2>
                        <div className="space-y-4">
                            <Link href="/registry/applications?status=submitted" className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="p-3 bg-primary-100 text-primary-600 rounded-lg mr-4 group-hover:scale-110 transition-transform">📝</div>
                                <div>
                                    <div className="font-semibold">Review New Submissions</div>
                                    <div className="text-sm text-gray-500">Check documents for new applications</div>
                                </div>
                                <div className="ml-auto text-primary-600 font-bold">→</div>
                            </Link>
                            <Link href="/registry/applications?status=incomplete" className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
                                <div className="p-3 bg-warning-100 text-warning-600 rounded-lg mr-4 group-hover:scale-110 transition-transform">⚠️</div>
                                <div>
                                    <div className="font-semibold">Pending Information</div>
                                    <div className="text-sm text-gray-500">Applications waiting for applicant correction</div>
                                </div>
                                <div className="ml-auto text-warning-600 font-bold">→</div>
                            </Link>
                        </div>
                    </div>

                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">Operational Status</h2>
                        <div className="text-sm text-gray-600">
                            <p>You are currently operating from the <strong>Registry Clerk</strong> portal.</p>
                            <p className="mt-2 text-xs text-gray-500 italic">* All actions are logged for audit purposes.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
