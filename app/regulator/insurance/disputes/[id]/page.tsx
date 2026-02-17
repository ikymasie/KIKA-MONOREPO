'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Claim {
    id: string;
    claimNumber: string;
    incidentDate: string;
    claimAmount: number;
    status: string;
    claimType: string;
    description: string;
    disputeReason: string;
    supportingDocuments: string[];
    disputeEvidenceUrls?: string[];
    committeeReviewNotes?: string;
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

export default function RegulatorClaimAudit({ params }: { params: { id: string } }) {
    const [claim, setClaim] = useState<Claim | null>(null);
    const [loading, setLoading] = useState(true);
    const [ruling, setRuling] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();

    const fetchClaim = async () => {
        try {
            const res = await fetch(`/api/admin/insurance/claims/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setClaim(data);
            }
        } catch (error) {
            console.error('Failed to fetch claim:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClaim();
    }, [params.id]);

    const handleRuling = async (action: 'OVERTURN' | 'UPHOLD') => {
        if (!ruling) {
            alert('Please provide a ruling justification.');
            return;
        }
        setActionLoading(true);
        try {
            const res = await fetch(`/api/regulator/insurance/claims/${params.id}/rule`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ruling, action }),
            });

            if (res.ok) {
                alert('Ruling issued successfully.');
                router.push('/regulator/insurance/disputes');
            }
        } catch (error) {
            console.error('Ruling failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <DashboardLayout sidebar={<RegulatorSidebar />}><div className="p-8">Loading audit trail...</div></DashboardLayout>;
    if (!claim) return <DashboardLayout sidebar={<RegulatorSidebar />}><div className="p-8">Claim record not found.</div></DashboardLayout>;

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-10">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">Regulatory Audit Mode</h1>
                        <p className="text-gray-500 font-bold text-sm tracking-widest uppercase">Investigating Claim Audit Trail: {claim.claimNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Audit Trail (Note: Ideally this would be a real audit log table) */}
                        <div className="glass-panel p-8 bg-white border border-gray-100 shadow-xl">
                            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
                                <span className="text-2xl">📋</span> Full Audit History
                            </h3>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-1 bg-primary-200 rounded-full"></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Submission</p>
                                        <p className="text-xs font-bold text-gray-900 mt-1">Claim submitted by member.</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{format(new Date(claim.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                                    </div>
                                </div>

                                {claim.committeeReviewNotes && (
                                    <div className="flex gap-4">
                                        <div className="w-1 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Internal Review Notes</p>
                                            <div className="p-4 bg-amber-50 rounded-2xl mt-2 text-xs font-medium text-amber-900 whitespace-pre-line border border-amber-100 italic">
                                                {claim.committeeReviewNotes}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <div className="w-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Dispute Escalation</p>
                                        <div className="p-4 bg-indigo-50 rounded-2xl mt-2 text-xs font-bold text-indigo-900 border border-indigo-100 italic">
                                            "{claim.disputeReason}"
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold mt-2 italic flex items-center gap-2">
                                            📍 Initiated by Member via Mobile Portal
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Evidence Review */}
                        <div className="glass-panel p-8 bg-white border border-gray-100 shadow-xl">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Discovery & Evidence</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {[...(claim.supportingDocuments || []), ...(claim.disputeEvidenceUrls || [])].map((doc, idx) => (
                                    <a
                                        key={idx}
                                        href={doc}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-200 transition-all group"
                                    >
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                            <span className="text-lg">📁</span>
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exhibit {idx + 1}</p>
                                            <p className="text-xs font-bold text-primary-600 truncate">Analyze Document</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Summary Card */}
                        <div className="glass-panel p-8 bg-white border border-gray-100 shadow-xl">
                            <h3 className="text-lg font-black text-gray-900 mb-6">Case Summary</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-gray-400">Society</span>
                                    <span className="text-xs font-black text-gray-900 uppercase">{claim.tenant.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-gray-400">Claim Amount</span>
                                    <span className="text-xs font-black text-primary-600">P {Number(claim.claimAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs font-bold text-gray-400">Member</span>
                                    <span className="text-xs font-black text-gray-900 uppercase">{claim.policy.member.firstName} {claim.policy.member.lastName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Ruling Box */}
                        <div className="glass-panel p-8 bg-gray-950 text-white shadow-2xl relative overflow-hidden ring-4 ring-primary-500/20">
                            <h3 className="text-xl font-black mb-6 relative z-10 flex items-center gap-2">
                                <span className="text-primary-400">⚖️</span> Issue Ruling
                            </h3>

                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Compliance Order / Justification</p>
                            <textarea
                                value={ruling}
                                onChange={(e) => setRuling(e.target.value)}
                                placeholder="State the legal reasoning for Upholding or Overturning..."
                                className="w-full bg-gray-900 border-gray-800 rounded-2xl p-4 text-xs font-bold text-white mb-6 focus:ring-2 focus:ring-primary-500 outline-none min-h-[150px]"
                            />

                            <div className="space-y-3 relative z-10">
                                <button
                                    onClick={() => handleRuling('OVERTURN')}
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-success-600 hover:bg-success-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-success-600/20"
                                >
                                    Overturn (Issue Order to Pay)
                                </button>
                                <button
                                    onClick={() => handleRuling('UPHOLD')}
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                                >
                                    Uphold (Final Rejection)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
