'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';

function ApplicationsListContent() {
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get('status');
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchApps() {
            try {
                const url = statusFilter
                    ? `/api/registration/applications?status=${statusFilter}`
                    : '/api/registration/applications';
                const res = await fetch(url);
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
    }, [statusFilter]);

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'submitted') return 'bg-blue-100 text-blue-800';
        if (s === 'incomplete') return 'bg-warning-100 text-warning-800';
        if (s === 'under_review') return 'bg-secondary-100 text-secondary-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Application Intake Dashboard</h1>
                <div className="flex gap-2">
                    <Link href="/registry/applications" className={`px-4 py-2 rounded-lg text-sm font-medium ${!statusFilter ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>All</Link>
                    <Link href="/registry/applications?status=submitted" className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'submitted' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>New</Link>
                    <Link href="/registry/applications?status=incomplete" className={`px-4 py-2 rounded-lg text-sm font-medium ${statusFilter === 'incomplete' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Incomplete</Link>
                </div>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Proposed Name</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Applicant</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Submitted</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading applications...</td></tr>
                        ) : applications.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No applications found.</td></tr>
                        ) : (
                            applications.map((app) => (
                                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900">{app.proposedName}</td>
                                    <td className="px-6 py-4 capitalize">{app.applicationType.replace('_', ' ')}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">{app.primaryContactName}</div>
                                        <div className="text-xs text-gray-500">{app.primaryContactEmail}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(app.status)}`}>
                                            {app.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {new Date(app.submittedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/registry/applications/${app.id}`} className="btn-secondary px-3 py-1 text-xs">
                                            Intake Review
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function RegistryApplications() {
    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <Suspense fallback={<div className="p-8 text-center">Loading registry...</div>}>
                <ApplicationsListContent />
            </Suspense>
        </DashboardLayout>
    );
}
