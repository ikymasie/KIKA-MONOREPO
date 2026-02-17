'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { format } from 'date-fns';
import Link from 'next/link';

interface Claim {
    id: string;
    claimNumber: string;
    incidentDate: string;
    claimAmount: number;
    status: string;
    claimType: string;
    disputeReason: string;
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
    tenant: {
        name: string;
    };
    createdAt: string;
}

export default function RegulatorDisputeDashboard() {
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            // Regulator should see claims in REGULATOR_REVIEW or UNDER_APPEAL
            const res = await fetch('/api/admin/insurance/claims?status=under_appeal');
            if (res.ok) {
                const data = await res.json();
                setClaims(data);
            }
        } catch (error) {
            console.error('Failed to fetch disputes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <span className="text-primary-600 font-black text-xs uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full border border-primary-100 mb-4 inline-block">Compliance Monitoring</span>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Insurance Disputes</h1>
                        <p className="text-gray-500 font-medium text-lg mt-2">Investigate escalated insurance claims and issue regulatory rulings.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse"></div>)}
                    </div>
                ) : claims.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-6 opacity-40">⚖️</div>
                        <h3 className="text-2xl font-bold text-gray-900">No Pending Disputes</h3>
                        <p className="text-gray-500 mt-2 font-medium">All insurance disputes are currently settled.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {claims.map((claim) => (
                            <div key={claim.id} className="glass-panel p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 hover:border-primary-100 transition-all flex flex-col md:flex-row gap-8 items-start md:items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <p className="font-mono text-sm font-black text-primary-600">{claim.claimNumber}</p>
                                        <span className="text-[10px] font-black uppercase text-gray-400">Escalated by {claim.policy.member.firstName}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-2">{claim.tenant.name}</h3>
                                    <div className="flex gap-4 mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-500">Product:</span>
                                            <span className="text-xs font-black text-gray-900">{claim.policy.product.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-gray-500">Value:</span>
                                            <span className="text-xs font-black text-indigo-600">P {Number(claim.claimAmount).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-red-50 rounded-2xl border border-red-100 italic text-red-700 text-xs font-medium">
                                        Dispute Reason: "{claim.disputeReason}"
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[200px]">
                                    <Link
                                        href={`/regulator/insurance/disputes/${claim.id}`}
                                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest text-center hover:bg-primary-600 transition-all shadow-lg active:scale-95"
                                    >
                                        Investigate Audit Trail
                                    </Link>
                                    <div className="flex justify-between items-center px-4 py-2 bg-gray-50 rounded-xl">
                                        <span className="text-[10px] font-black text-gray-400 uppercase">SLA Status</span>
                                        <span className="text-[10px] font-black text-success-600 uppercase">Within 48h</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
