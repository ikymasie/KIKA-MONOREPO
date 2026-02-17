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

export default function RegistrarDashboard() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPending() {
            try {
                const res = await fetch('/api/registration/pending');
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
        fetchPending();
    }, []);

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 font-display">Registrar Workspace</h1>
                    <p className="text-gray-600 mt-2">Applications awaiting final approval and registration number assignment.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card-glass p-6 border-t-4 border-primary-500">
                        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Awaiting Decision</div>
                        <div className="text-4xl font-bold text-primary-600 mt-2">{applications.length}</div>
                        <p className="text-xs text-gray-500 mt-2">Applications requiring Registrar sign-off</p>
                    </div>
                </div>

                <div className="card p-0 overflow-hidden border-white/40 shadow-xl">
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800">Pending Approvals</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/30 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Society Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Contact Person</th>
                                    <th className="px-6 py-4">Submitted</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center"><div className="animate-spin inline-block w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full"></div></td></tr>
                                ) : applications.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">No applications currently awaiting decision.</td></tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-primary-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{app.proposedName}</div>
                                                <div className="text-xs text-gray-500">ID: {app.id.substring(0, 8)}...</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="capitalize px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                                                    {app.applicationType.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-600">{app.primaryContactName}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(app.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-4 bg-amber-100 text-amber-800 uppercase tracking-tighter">
                                                    Pending Decision
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link
                                                    href={`/regulator/applications/${app.id}`}
                                                    className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg transition-all shadow-md hover:shadow-primary-300 transform group-hover:scale-105"
                                                >
                                                    Final Review
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
