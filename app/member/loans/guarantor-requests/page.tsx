'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { format } from 'date-fns';

interface GuarantorRequest {
    id: string;
    loan: {
        loanNumber: string;
        principalAmount: number;
        product: {
            name: string;
        };
        member: {
            firstName: string;
            lastName: string;
        };
    };
    guaranteedAmount: number;
    status: string;
    createdAt: string;
    responseDeadline: string | null;
}

export default function GuarantorRequestsPage() {
    const [requests, setRequests] = useState<GuarantorRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/member/guarantor-requests');
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            } else {
                throw new Error('Failed to fetch requests');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, status: 'accepted' | 'rejected', rejectionReason?: string) => {
        try {
            setProcessingId(requestId);
            const res = await fetch('/api/member/guarantor-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status, rejectionReason })
            });

            if (res.ok) {
                alert(`Request ${status} successfully`);
                fetchRequests();
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Failed to update request');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-5xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Guarantor Requests</h1>
                    <p className="text-gray-500 font-medium text-lg mt-2">Manage requests from fellow members to guarantee their loans.</p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-[2rem] animate-pulse"></div>)}
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 italic">
                        {error}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-6 opacity-40">🤝</div>
                        <h3 className="text-2xl font-bold text-gray-900">No Pending Requests</h3>
                        <p className="text-gray-500 mt-2 font-medium">You don't have any guarantor requests at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {requests.map((request) => (
                            <div key={request.id} className="relative overflow-hidden bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10 hover:shadow-2xl transition-all duration-500 group">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full blur-3xl -mr-24 -mt-24 group-hover:bg-primary-100 transition-all opacity-50"></div>

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-primary-50 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-100">
                                                    {request.loan.product.name}
                                                </span>
                                                {request.responseDeadline && (
                                                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                                                        <span>⏰</span> Due {format(new Date(request.responseDeadline), 'MMM dd')}
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="text-2xl font-black text-gray-900">
                                                {request.loan.member.firstName} {request.loan.member.lastName}
                                            </h2>
                                            <p className="text-gray-500 font-bold mt-1">Loan #{request.loan.loanNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Pledge Amount</p>
                                            <p className="text-4xl font-black text-primary-600">P {Number(request.guaranteedAmount).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Loan Details</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500 font-medium">Principal Amount</span>
                                                    <span className="font-bold text-gray-900">P {Number(request.loan.principalAmount).toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500 font-medium">Request Date</span>
                                                    <span className="font-bold text-gray-900">{format(new Date(request.createdAt), 'MMM dd, yyyy')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="text-sm text-gray-600 font-medium italic">
                                                By accepting this request, you agree to be a guarantor for this loan and may be liable for repayment if the borrower defaults.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-4">
                                        <button
                                            disabled={processingId === request.id}
                                            onClick={() => handleAction(request.id, 'accepted')}
                                            className="flex-1 py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {processingId === request.id ? 'Processing...' : 'Accept Guarantee'}
                                        </button>
                                        <button
                                            disabled={processingId === request.id}
                                            onClick={() => {
                                                const reason = prompt('Please provide a reason for rejection:');
                                                if (reason !== null) handleAction(request.id, 'rejected', reason);
                                            }}
                                            className="flex-1 py-5 bg-white text-gray-900 border-2 border-gray-100 font-black rounded-2xl hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Decline Request
                                        </button>
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
