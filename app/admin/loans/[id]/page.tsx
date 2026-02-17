'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface LoanDetail {
    id: string;
    loanNumber: string;
    member: {
        id: string;
        memberNumber: string;
        firstName: string;
        lastName: string;
        fullName: string;
        email: string;
        phone: string;
        nationalId: string;
        employer: string;
    };
    product: {
        id: string;
        name: string;
        code: string;
        interestRate: number;
        savingsMultiplier: number;
    };
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyInstallment: number;
    processingFee: number;
    insuranceFee: number;
    totalAmountDue: number;
    outstandingBalance: number;
    amountPaid: number;
    status: string;
    applicationDate: string;
    approvalDate?: string;
    disbursementDate?: string;
    maturityDate?: string;
    purpose?: string;
    rejectionReason?: string;
    isPastDue: boolean;
    guarantors: Array<{
        id: string;
        guarantorMember: {
            id: string;
            memberNumber: string;
            fullName: string;
        };
        guaranteedAmount: number;
        status: string;
    }>;
}

export default function LoanDetailPage() {
    const router = useRouter();
    const params = useParams();
    const loanId = params.id as string;

    const [loan, setLoan] = useState<LoanDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchLoanDetails();
    }, [loanId]);

    async function fetchLoanDetails() {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/loans/${loanId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch loan details');
            }
            const result = await response.json();
            setLoan(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove() {
        if (!confirm('Are you sure you want to approve this loan application?')) return;

        try {
            setActionLoading(true);
            const response = await fetch(`/api/admin/loans/${loanId}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to approve loan');
            }

            alert('Loan approved successfully!');
            fetchLoanDetails();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleReject() {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(true);
            const response = await fetch(`/api/admin/loans/${loanId}/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to reject loan');
            }

            alert('Loan rejected successfully!');
            setShowRejectModal(false);
            setRejectionReason('');
            fetchLoanDetails();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    }

    async function handleDisburse() {
        if (!confirm('Are you sure you want to disburse this loan? This action will transfer funds to the member.')) return;

        try {
            setActionLoading(true);
            const response = await fetch(`/api/admin/loans/${loanId}/disburse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ disbursementMethod: 'bank_transfer' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to disburse loan');
            }

            alert('Loan disbursed successfully!');
            fetchLoanDetails();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    }

    function getStatusBadgeColor(status: string) {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-amber-100 text-amber-700';
            case 'approved':
                return 'bg-blue-100 text-blue-700';
            case 'disbursed':
                return 'bg-indigo-100 text-indigo-700';
            case 'active':
                return 'bg-success-100 text-success-700';
            case 'rejected':
                return 'bg-danger-100 text-danger-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }

    if (loading) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-64 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !loan) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8">
                    <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                        <p className="text-danger-700">Error: {error || 'Loan not found'}</p>
                    </div>
                    <button onClick={() => router.back()} className="mt-4 btn btn-secondary">
                        Go Back
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Loans
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Loan Application</h1>
                        <p className="text-gray-600 mt-1">{loan.loanNumber}</p>
                    </div>
                    <span className={`px-4 py-2 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeColor(loan.status)}`}>
                        {loan.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>

                {/* Action Buttons */}
                {loan.status === 'pending' && (
                    <div className="mb-6 flex gap-4">
                        <button
                            onClick={handleApprove}
                            disabled={actionLoading}
                            className="btn bg-success-600 hover:bg-success-700 text-white disabled:opacity-50"
                        >
                            {actionLoading ? 'Processing...' : '✓ Approve Loan'}
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="btn bg-danger-600 hover:bg-danger-700 text-white disabled:opacity-50"
                        >
                            ✗ Reject Loan
                        </button>
                    </div>
                )}

                {loan.status === 'approved' && (
                    <div className="mb-6">
                        <button
                            onClick={handleDisburse}
                            disabled={actionLoading}
                            className="btn bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
                        >
                            {actionLoading ? 'Processing...' : '💰 Disburse Loan'}
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Member Information */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4">Member Information</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                                    <p className="text-gray-900 font-medium">{loan.member.fullName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Member Number</label>
                                    <p className="text-gray-900 font-medium">{loan.member.memberNumber}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">National ID</label>
                                    <p className="text-gray-900 font-medium">{loan.member.nationalId}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Phone</label>
                                    <p className="text-gray-900 font-medium">{loan.member.phone}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Email</label>
                                    <p className="text-gray-900 font-medium">{loan.member.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Employer</label>
                                    <p className="text-gray-900 font-medium">{loan.member.employer || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Loan Details */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4">Loan Details</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Product</label>
                                    <p className="text-gray-900 font-medium">{loan.product.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Principal Amount</label>
                                    <p className="text-gray-900 font-medium text-lg">P {loan.principalAmount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Interest Rate</label>
                                    <p className="text-gray-900 font-medium">{loan.interestRate}%</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Term</label>
                                    <p className="text-gray-900 font-medium">{loan.termMonths} months</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Monthly Installment</label>
                                    <p className="text-gray-900 font-medium">P {loan.monthlyInstallment.toLocaleString()}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Total Amount Due</label>
                                    <p className="text-gray-900 font-medium text-lg">P {loan.totalAmountDue.toLocaleString()}</p>
                                </div>
                                {loan.processingFee > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Processing Fee</label>
                                        <p className="text-gray-900 font-medium">P {loan.processingFee.toLocaleString()}</p>
                                    </div>
                                )}
                                {loan.insuranceFee > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Insurance Fee</label>
                                        <p className="text-gray-900 font-medium">P {loan.insuranceFee.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                            {loan.purpose && (
                                <div className="mt-4">
                                    <label className="text-sm font-medium text-gray-600">Purpose</label>
                                    <p className="text-gray-900 mt-1">{loan.purpose}</p>
                                </div>
                            )}
                        </div>

                        {/* Guarantors */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4">Guarantors ({loan.guarantors.length})</h2>
                            {loan.guarantors.length > 0 ? (
                                <div className="space-y-3">
                                    {loan.guarantors.map((guarantor) => (
                                        <div key={guarantor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{guarantor.guarantorMember.fullName}</p>
                                                <p className="text-sm text-gray-600">{guarantor.guarantorMember.memberNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">P {guarantor.guaranteedAmount.toLocaleString()}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full ${guarantor.status === 'accepted' ? 'bg-success-100 text-success-700' :
                                                        guarantor.status === 'rejected' ? 'bg-danger-100 text-danger-700' :
                                                            'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {guarantor.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No guarantors required</p>
                            )}
                        </div>

                        {loan.rejectionReason && (
                            <div className="card p-6 border-l-4 border-danger-500">
                                <h2 className="text-xl font-bold mb-2 text-danger-700">Rejection Reason</h2>
                                <p className="text-gray-900">{loan.rejectionReason}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Timeline */}
                        <div className="card p-6">
                            <h2 className="text-lg font-bold mb-4">Timeline</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-600">Application Date</label>
                                    <p className="text-gray-900 font-medium">{new Date(loan.applicationDate).toLocaleDateString()}</p>
                                </div>
                                {loan.approvalDate && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Approval Date</label>
                                        <p className="text-gray-900 font-medium">{new Date(loan.approvalDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {loan.disbursementDate && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Disbursement Date</label>
                                        <p className="text-gray-900 font-medium">{new Date(loan.disbursementDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                                {loan.maturityDate && (
                                    <div>
                                        <label className="text-xs font-medium text-gray-600">Maturity Date</label>
                                        <p className="text-gray-900 font-medium">{new Date(loan.maturityDate).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Summary */}
                        {(loan.status === 'disbursed' || loan.status === 'active') && (
                            <div className="card p-6">
                                <h2 className="text-lg font-bold mb-4">Payment Summary</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Due</span>
                                        <span className="font-medium">P {loan.totalAmountDue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount Paid</span>
                                        <span className="font-medium text-success-600">P {loan.amountPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-3 border-t">
                                        <span className="font-medium">Outstanding</span>
                                        <span className="font-bold text-lg">P {loan.outstandingBalance.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Rejection Modal */}
                {showRejectModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold mb-4">Reject Loan Application</h3>
                            <p className="text-gray-600 mb-4">Please provide a reason for rejecting this loan application:</p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                placeholder="Enter rejection reason..."
                            />
                            <div className="mt-4 flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setRejectionReason('');
                                    }}
                                    className="btn btn-secondary"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="btn bg-danger-600 hover:bg-danger-700 text-white"
                                    disabled={actionLoading || !rejectionReason.trim()}
                                >
                                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
