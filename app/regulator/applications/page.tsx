'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';

interface Application {
    id: string;
    proposedName: string;
    applicationType: string;
    status: string;
    submittedAt: string;
    primaryContactName: string;
}

export default function RegulatorApplications() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchApps() {
            // Re-use existing lists API or create new one?
            // Assuming GET /api/regulator/applications exists or similar
            // If not, I'll create /api/regulator/applications/route.ts next
            try {
                const res = await fetch('/api/regulator/applications');
                if (res.ok) {
                    const data = await res.json();
                    setApplications(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchApps();
    }, []);

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'approved') return 'bg-success-100 text-success-800';
        if (s === 'rejected') return 'bg-danger-100 text-danger-800';
        if (s === 'submitted' || s === 'pending') return 'bg-warning-100 text-warning-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Society Applications</h1>

                <div className="card overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Proposed Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : applications.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-4 text-center">No applications found.</td></tr>
                            ) : (
                                applications.map((app) => (
                                    <tr key={app.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{app.proposedName}</td>
                                        <td className="px-6 py-4 capitalize">{app.applicationType.replace('_', ' ')}</td>
                                        <td className="px-6 py-4">{app.primaryContactName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/regulator/applications/${app.id}`} className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
