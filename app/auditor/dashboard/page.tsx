'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-hooks';

interface AccessRequest {
    id: string;
    tenant: {
        id: string;
        name: string;
        code: string;
    };
    status: string;
    startDate: string;
    endDate: string;
    purpose: string;
}

export default function AuditorDashboard() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRequests() {
            try {
                const res = await fetch('/api/external-auditor/access-request');
                if (res.ok) {
                    const data = await res.json();
                    setRequests(data);
                }
            } catch (e) {
                console.error('Error fetching requests:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchRequests();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-800';
            case 'pending': return 'bg-amber-100 text-amber-800';
            case 'rejected': return 'bg-rose-100 text-rose-800';
            case 'expired': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isActive = (req: AccessRequest) => {
        if (req.status !== 'approved') return false;
        const now = new Date();
        return new Date(req.startDate) <= now && new Date(req.endDate) >= now;
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 text-glow">Auditor Dashboard</h1>
                    <p className="text-gray-600 mt-2">Welcome, {user?.name}. Manage your audit engagements and access requests.</p>
                </div>
                <Link href="/auditor/access" className="btn btn-primary shadow-emerald-200">
                    + New Access Request
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 border-emerald-100">
                    <div className="text-emerald-600 text-sm font-semibold uppercase tracking-wider mb-1">Active Audits</div>
                    <div className="text-4xl font-bold text-gray-900">{requests.filter(isActive).length}</div>
                </div>
                <div className="glass-panel p-6 border-amber-100">
                    <div className="text-amber-600 text-sm font-semibold uppercase tracking-wider mb-1">Pending Requests</div>
                    <div className="text-4xl font-bold text-gray-900">{requests.filter(r => r.status === 'pending').length}</div>
                </div>
                <div className="glass-panel p-6 border-blue-100">
                    <div className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-1">Total Engagements</div>
                    <div className="text-4xl font-bold text-gray-900">{requests.length}</div>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="p-6 border-b border-white/20 bg-white/10">
                    <h2 className="text-xl font-bold text-gray-900">Your Audit Access Requests</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Organization</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Period</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Loading your requests...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">No access requests found. Start by requesting access to a SACCOS.</td></tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-white/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{req.tenant.name}</div>
                                            <div className="text-xs text-gray-500">{req.tenant.code}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(req.status)}`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isActive(req) ? (
                                                <Link
                                                    href={`/auditor/${req.id}/records`}
                                                    className="text-emerald-600 hover:text-emerald-800 font-bold text-sm flex items-center gap-1 group"
                                                >
                                                    🚀 Enter Portal
                                                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                </Link>
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">Waiting for approval</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
