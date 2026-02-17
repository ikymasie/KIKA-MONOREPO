'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';

export default function IntelligenceDashboard() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchVettingTasks() {
            try {
                // Fetch applications in security vetting status
                const res = await fetch('/api/registration/applications?status=security_vetting');
                if (res.ok) {
                    setApplications(await res.json());
                }
            } catch (error) {
                console.error('Fetch vetting tasks error:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchVettingTasks();
    }, []);

    const stats = [
        { label: 'Pending Vetting', value: applications.length, color: 'text-amber-600', bg: 'bg-amber-50', icon: '🕵️‍♂️' },
        { label: 'Critical Risks', value: 0, color: 'text-danger-600', bg: 'bg-danger-50', icon: '🚨' },
        { label: 'Cleared This Week', value: 0, color: 'text-success-600', bg: 'bg-success-50', icon: '✅' },
    ];

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Liaison</h1>
                        <p className="text-gray-500 font-medium">Security screening and risk management workspace.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Session</div>
                        <div className="text-indigo-600 font-bold">Officer #ID-8821</div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className={`card p-6 ${stat.bg} border-none shadow-sm flex items-center gap-4`}>
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl">
                                {stat.icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{stat.label}</div>
                                <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="card border-none shadow-xl shadow-indigo-100/50 overflow-hidden">
                    <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Pending Security Reviews</h2>
                            <p className="text-sm text-gray-500">Manual vetting required for registration approval.</p>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search by name or file #..."
                                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase font-black tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4">Society Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Submitted</th>
                                    <th className="px-6 py-4">File Number</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                        <div className="animate-pulse flex items-center justify-center gap-2">
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                            <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                        </div>
                                    </td></tr>
                                ) : applications.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                        <div className="text-4xl mb-2">🏖️</div>
                                        All clear! No pending reviews at the moment.
                                    </td></tr>
                                ) : (
                                    applications.map((app) => (
                                        <tr key={app.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="font-bold text-gray-900">{app.proposedName}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{app.primaryContactName}</div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-black uppercase tracking-tight">
                                                    {app.applicationType.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-gray-500 font-medium">
                                                {new Date(app.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-mono text-xs text-indigo-600 font-black bg-indigo-50 inline-block px-2 py-1 rounded">
                                                    {app.fileNumber}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <Link
                                                    href={`/intelligence/screening/${app.id}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                                >
                                                    Start Screening
                                                    <span>→</span>
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
