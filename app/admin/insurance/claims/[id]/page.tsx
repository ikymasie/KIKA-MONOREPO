'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-hooks';

interface Claim {
    id: string;
    claimNumber: string;
    incidentDate: string;
    claimAmount: number;
    status: string;
    claimType: string;
    description: string;
    supportingDocuments: string[];
    policy: {
        policyNumber: string;
        member: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        product: {
            name: string;
            coverageAmount: number;
        }
    };
    rejectionReason?: string;
    queryReason?: string;
    committeeReviewNotes?: string;
    createdAt: string;
}

export default function ClaimDetailReview({ params }: { params: { id: string } }) {
    const [claim, setClaim] = useState<Claim | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [notes, setNotes] = useState('');
    const router = useRouter();
    const { user } = useAuth();

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

    const handleAction = async (action: string, extraData: any = {}) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/insurance/claims/${params.id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, notes, ...extraData }),
            });

            if (res.ok) {
                fetchClaim();
                setNotes('');
            } else {
                const err = await res.json();
                alert(err.error || 'Action failed');
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <DashboardLayout sidebar={<AdminSidebar />}><div className="p-8">Loading...</div></DashboardLayout>;
    if (!claim) return <DashboardLayout sidebar={<AdminSidebar />}><div className="p-8">Claim not found.</div></DashboardLayout>;

    const canVerify = (user?.role === 'member_service_rep' || user?.role === 'saccos_admin') && claim.status === 'submitted';
    const canApprove = user?.role === 'saccos_admin' && (claim.status === 'in_review' || claim.status === 'under_appeal' || claim.status === 'submitted');
    const canPay = (user?.role === 'accountant' || user?.role === 'saccos_admin') && claim.status === 'approved';

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8 max-w-5xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Review Claim</h1>
                        <p className="text-gray-500 font-bold text-sm"># {claim.claimNumber}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Claim Details */}
                        <div className="glass-panel p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Claim Information</h3>
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Claim Type</p>
                                    <p className="font-bold text-gray-900 uppercase">{claim.claimType}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Incident Date</p>
                                    <p className="font-bold text-gray-900">{format(new Date(claim.incidentDate), 'MMMM dd, yyyy')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Claim Amount</p>
                                    <p className="text-2xl font-black text-primary-600">P {Number(claim.claimAmount).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Status</p>
                                    <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100">
                                        {claim.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Member Statement</p>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 italic text-gray-600 font-medium">
                                    "{claim.description}"
                                </div>
                            </div>
                        </div>

                        {/* Documents */}
                        <div className="glass-panel p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Evidence & Documents</h3>
                            {claim.supportingDocuments && claim.supportingDocuments.length > 0 ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {claim.supportingDocuments.map((doc, idx) => (
                                        <a
                                            key={idx}
                                            href={doc}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                                                <span className="text-lg">📄</span>
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-black text-gray-900 truncate">Document {idx + 1}</p>
                                                <p className="text-[10px] font-bold text-primary-600">View File</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 font-medium text-center py-8">No documents uploaded.</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Member Card */}
                        <div className="glass-panel p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                            <h3 className="text-xl font-black text-gray-900 mb-6">Beneficiary Info</h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Claimant Member</p>
                                    <p className="font-bold text-gray-900">{claim.policy.member.firstName} {claim.policy.member.lastName}</p>
                                    <p className="text-xs text-gray-500">{claim.policy.member.email}</p>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Insurance Product</p>
                                    <p className="font-bold text-gray-900">{claim.policy.product.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Box */}
                        <div className="glass-panel p-8 bg-gray-900 text-white shadow-2xl shadow-gray-900/40 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                            <h3 className="text-xl font-black mb-6 relative z-10">Workflow Action</h3>

                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Add notes (Query reason, rejection cause...)"
                                className="w-full bg-gray-800 border-gray-700 rounded-2xl p-4 text-xs font-bold text-white mb-6 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none min-h-[100px]"
                            />

                            <div className="space-y-3 relative z-10">
                                {canVerify && (
                                    <button
                                        onClick={() => handleAction('VERIFY')}
                                        disabled={actionLoading}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Mark as Verified
                                    </button>
                                )}

                                {canApprove && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleAction('APPROVE')}
                                            disabled={actionLoading}
                                            className="py-4 bg-success-600 hover:bg-success-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction('REJECT')}
                                            disabled={actionLoading}
                                            className="py-4 bg-red-600 hover:bg-red-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                )}

                                {canPay && (
                                    <button
                                        onClick={() => handleAction('DISBURSE')}
                                        disabled={actionLoading}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Disburse Payment
                                    </button>
                                )}

                                <button
                                    onClick={() => handleAction('QUERY')}
                                    disabled={actionLoading}
                                    className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                                >
                                    Query / Request Information
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
