'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { format } from 'date-fns';
import Link from 'next/link';

interface Claim {
    id: string;
    claimNumber: string;
    incidentDate: string;
    claimAmount: number;
    status: string;
    claimType: string;
    policy: {
        policyNumber: string;
        member: {
            firstName: string;
            lastName: string;
        };
        product: {
            name: string;
        }
    };
    createdAt: string;
}

export default function AdminClaimsDashboard() {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const fetchClaims = async (status?: string) => {
        setLoading(true);
        try {
            const url = status && status !== 'all'
                ? `/api/admin/insurance/claims?status=${status}`
                : '/api/admin/insurance/claims';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setClaims(data);
            }
        } catch (error) {
            console.error('Failed to fetch claims:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaims(filter);
    }, [filter]);

    const statusTabs = [
        { label: 'All queue', value: 'all' },
        { label: 'New/Submitted', value: 'submitted' },
        { label: 'In Review', value: 'in_review' },
        { label: 'Approved', value: 'approved' },
        { label: 'Disputed', value: 'under_appeal' },
    ];

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Claims Workspace</h1>
                        <p className="text-gray-500 font-medium text-lg mt-2">Manage, verify, and adjudicate insurance claims.</p>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-8 w-fit">
                    {statusTabs.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilter(tab.value)}
                            className={`px-6 py-3 rounded-xl text-sm font-black transition-all ${filter === tab.value
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse"></div>)}
                    </div>
                ) : claims.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-6 opacity-40">📄</div>
                        <h3 className="text-2xl font-bold text-gray-900">No Claims Found</h3>
                        <p className="text-gray-500 mt-2 font-medium">There are no claims in this queue.</p>
                    </div>
                ) : (
                    <div className="glass-panel overflow-hidden bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Claim #</th>
                                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Member</th>
                                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Policy/Product</th>
                                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {claims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <p className="font-mono text-xs font-bold text-primary-600">{claim.claimNumber}</p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-1">Filed: {format(new Date(claim.createdAt), 'MMM dd, yyyy')}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-gray-900">{claim.policy.member.firstName} {claim.policy.member.lastName}</p>
                                            <p className="text-xs text-gray-500 font-medium"># {claim.policy.policyNumber}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-gray-900">{claim.policy.product.name}</p>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                {claim.claimType}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-lg font-black text-gray-900">P {Number(claim.claimAmount).toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${claim.status === 'paid' ? 'bg-success-50 text-success-700 border-success-100' :
                                                    claim.status === 'approved' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                        claim.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            claim.status === 'under_appeal' ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' :
                                                                'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {claim.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <Link
                                                href={`/admin/insurance/claims/${claim.id}`}
                                                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-primary-600 transition-all active:scale-95"
                                            >
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
