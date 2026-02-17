'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface AccessRequest {
    id: string;
    auditor: {
        firstName: string;
        lastName: string;
        email: string;
    };
    status: string;
    startDate: string;
    endDate: string;
    purpose: string;
    createdAt: string;
}

export default function AuditorAccessApprovalPage() {
    const [requests, setRequests] = useState<AccessRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, []);

    async function fetchRequests() {
        try {
            const res = await fetch('/api/admin/governance/auditor-access');
            if (res.ok) {
                setRequests(await res.json());
            }
        } catch (e) {
            console.error('Error fetching requests:', e);
        } finally {
            setLoading(false);
        }
    }

    async function handleAction(requestId: string, action: 'approve' | 'reject') {
        if (!confirm(`Are you sure you want to ${action} this access request?`)) return;

        try {
            const res = await fetch(`/api/admin/governance/auditor-access?requestId=${requestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                alert(`Request ${action}ed successfully`);
                fetchRequests();
            } else {
                const err = await res.json();
                alert(err.error || `Failed to ${action} request`);
            }
        } catch (e) {
            console.error(`Error ${action}ing request:`, e);
        }
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">External Auditor Access</h1>
                    <p className="text-gray-600 mt-2">Manage time-bound access for third-party auditors to your society's records.</p>
                </div>

                <div className="glass-panel overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-white/50">
                        <h2 className="text-xl font-bold text-gray-900">Access Requests</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Auditor</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Requested Period</th>
                                    <th className="px-6 py-4">Purpose</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading requests...</td></tr>
                                ) : requests.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No access requests found for your society.</td></tr>
                                ) : (
                                    requests.map((req) => (
                                        <tr key={req.id} className="hover:bg-white/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900">{req.auditor.firstName} {req.auditor.lastName}</div>
                                                <div className="text-xs text-gray-500">{req.auditor.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase 
                                                    ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-rose-100 text-rose-800'}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div>{new Date(req.startDate).toLocaleDateString()}</div>
                                                <div className="text-xs">to</div>
                                                <div>{new Date(req.endDate).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600 max-w-xs truncate" title={req.purpose}>
                                                    {req.purpose}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {req.status === 'pending' ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleAction(req.id, 'approve')}
                                                            className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded hover:bg-emerald-600"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(req.id, 'reject')}
                                                            className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded hover:bg-rose-600"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">Processed</span>
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
        </DashboardLayout>
    );
}
