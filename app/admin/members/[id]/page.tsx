'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface MemberDetail {
    id: string;
    memberNumber: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    nationalId: string;
    passportNumber?: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    physicalAddress?: string;
    postalAddress?: string;
    status: string;
    employmentStatus: string;
    employer?: string;
    employeeNumber?: string;
    shareCapital: number;
    joinDate: string;
    loans: Array<{
        id: string;
        loanNumber: string;
        principalAmount: number;
        outstandingBalance: number;
        status: string;
        product: { name: string };
        disbursementDate?: string;
    }>;
    savings: Array<{
        id: string;
        balance: number;
        monthlyContribution: number;
        isActive: boolean;
        product: { name: string };
    }>;
    insurancePolicies: Array<{
        id: string;
        policyNumber: string;
        coverageAmount: number;
        monthlyPremium: number;
        status: string;
        product: { name: string };
    }>;
    beneficiaries: Array<{
        id: string;
        firstName: string;
        lastName: string;
        relationship: string;
        allocationPercentage: number;
    }>;
    dependents: Array<{
        id: string;
        firstName: string;
        lastName: string;
        relationship: string;
        isActive: boolean;
    }>;
    kyc?: {
        identityVerified: boolean;
        residenceVerified: boolean;
        incomeVerified: boolean;
    };
}

export default function MemberDetailPage() {
    const router = useRouter();
    const params = useParams();
    const memberId = params.id as string;

    const [member, setMember] = useState<MemberDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string>('');

    useEffect(() => {
        fetchMemberDetails();
    }, [memberId]);

    async function fetchMemberDetails() {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/members/${memberId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch member details');
            }
            const result = await response.json();
            setMember(result.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusUpdate(status: string) {
        if (status === 'deceased') {
            setPendingStatus(status);
            setShowStatusModal(true);
            return;
        }

        if (member?.status === 'deceased' && status === 'active') {
            alert('Error: Cannot reactivate a member marked as DECEASED');
            return;
        }

        performStatusUpdate(status);
    }

    async function performStatusUpdate(status: string) {
        try {
            setActionLoading(true);
            const response = await fetch(`/api/admin/members/${memberId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to update status');
            }

            alert('Status updated successfully');
            setShowStatusModal(false);
            fetchMemberDetails();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    }

    function getStatusBadgeColor(status: string) {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-success-100 text-success-700';
            case 'inactive':
                return 'bg-gray-100 text-gray-700';
            case 'suspended':
                return 'bg-warning-100 text-warning-700';
            case 'deceased':
                return 'bg-danger-100 text-danger-700';
            case 'resigned':
            case 'retired':
                return 'bg-amber-100 text-amber-700';
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

    if (error || !member) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8">
                    <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                        <p className="text-danger-700">Error: {error || 'Member not found'}</p>
                    </div>
                    <button onClick={() => router.back()} className="mt-4 btn btn-secondary">
                        Go Back
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const totalSavings = member.savings.reduce((sum, s) => sum + Number(s.balance), 0);
    const activeLoans = member.loans.filter(l => ['active', 'disbursed'].includes(l.status.toLowerCase()));
    const totalOutstanding = activeLoans.reduce((sum, l) => sum + Number(l.outstandingBalance), 0);

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
                            Back to Members
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {member.firstName} {member.middleName ? member.middleName + ' ' : ''}{member.lastName}
                        </h1>
                        <p className="text-gray-600 mt-1">Member Number: {member.memberNumber}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select
                            onChange={(e) => handleStatusUpdate(e.target.value)}
                            value={member.status}
                            className={`px-4 py-2 rounded-lg border font-semibold ${getStatusBadgeColor(member.status)} border-transparent focus:ring-2 focus:ring-primary-500 outline-none`}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                            <option value="deceased">Deceased</option>
                            <option value="resigned">Resigned</option>
                            <option value="retired">Retired</option>
                        </select>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card p-6 bg-primary-50">
                        <h3 className="text-sm font-medium text-primary-700 uppercase">Total Savings</h3>
                        <p className="text-3xl font-bold text-primary-900">P {totalSavings.toLocaleString()}</p>
                        <p className="text-xs text-primary-600 mt-1">{member.savings.length} Accounts</p>
                    </div>
                    <div className="card p-6 bg-success-50">
                        <h3 className="text-sm font-medium text-success-700 uppercase">Share Capital</h3>
                        <p className="text-3xl font-bold text-success-900">P {Number(member.shareCapital).toLocaleString()}</p>
                        <p className="text-xs text-success-600 mt-1">Full Paid</p>
                    </div>
                    <div className="card p-6 bg-warning-50">
                        <h3 className="text-sm font-medium text-warning-700 uppercase">Outstanding Loans</h3>
                        <p className="text-3xl font-bold text-warning-900">P {totalOutstanding.toLocaleString()}</p>
                        <p className="text-xs text-warning-600 mt-1">{activeLoans.length} Active Loans</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Profile Info */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Profile Information
                            </h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">National ID / Passport</label>
                                    <p className="text-gray-900 font-medium">{member.nationalId} {member.passportNumber ? `/ ${member.passportNumber}` : ''}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Date of Birth</label>
                                    <p className="text-gray-900 font-medium">{new Date(member.dateOfBirth).toLocaleDateString()} ({member.gender})</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Email Address</label>
                                    <p className="text-gray-900 font-medium">{member.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                                    <p className="text-gray-900 font-medium">{member.phone}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Employment</label>
                                    <p className="text-gray-900 font-medium">{member.employmentStatus.replace('_', ' ').toUpperCase()} - {member.employer || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Join Date</label>
                                    <p className="text-gray-900 font-medium">{new Date(member.joinDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Physical Address</label>
                                    <p className="text-gray-900 font-medium">{member.physicalAddress || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Postal Address</label>
                                    <p className="text-gray-900 font-medium">{member.postalAddress || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Loans Table */}
                        <div className="card overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-bold">Loans</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Loan #</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Outstanding</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {member.loans.length > 0 ? member.loans.map(loan => (
                                            <tr key={loan.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/admin/loans/${loan.id}`)}>
                                                <td className="px-6 py-4 text-sm font-medium text-primary-600">{loan.loanNumber}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">{loan.product.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">P {Number(loan.principalAmount).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">P {Number(loan.outstandingBalance).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${['active', 'disbursed'].includes(loan.status.toLowerCase()) ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {loan.status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No loans found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Savings Table */}
                        <div className="card overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-xl font-bold">Savings Accounts</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Balance</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Monthly Cont.</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {member.savings.length > 0 ? member.savings.map(save => (
                                            <tr key={save.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{save.product.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 font-bold">P {Number(save.balance).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900">P {Number(save.monthlyContribution).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${save.isActive ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {save.isActive ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No savings accounts found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* KYC Status */}
                        <div className="card p-6">
                            <h2 className="text-lg font-bold mb-4">KYC Verification</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Identity Verified</span>
                                    <span className={member.kyc?.identityVerified ? 'text-success-600' : 'text-danger-600'}>
                                        {member.kyc?.identityVerified ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Residence Verified</span>
                                    <span className={member.kyc?.residenceVerified ? 'text-success-600' : 'text-danger-600'}>
                                        {member.kyc?.residenceVerified ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Income Verified</span>
                                    <span className={member.kyc?.incomeVerified ? 'text-success-600' : 'text-danger-600'}>
                                        {member.kyc?.incomeVerified ? '✓' : '✗'}
                                    </span>
                                </div>
                                <div className="pt-3 mt-3 border-t">
                                    <span className={`w-full block text-center py-2 px-4 rounded-lg text-sm font-bold ${member.kyc?.identityVerified && member.kyc?.residenceVerified && member.kyc?.incomeVerified ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                                        {member.kyc?.identityVerified && member.kyc?.residenceVerified && member.kyc?.incomeVerified ? 'FULLY VERIFIED' : 'PENDING VERIFICATION'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Insurance Policies */}
                        <div className="card p-6">
                            <h2 className="text-lg font-bold mb-4">Insurance</h2>
                            {member.insurancePolicies.length > 0 ? (
                                <div className="space-y-4">
                                    {member.insurancePolicies.map(policy => (
                                        <div key={policy.id} className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-bold text-gray-900">{policy.product.name}</p>
                                            <p className="text-xs text-gray-600">{policy.policyNumber}</p>
                                            <div className="mt-2 flex justify-between items-center">
                                                <span className="text-xs font-medium">P {Number(policy.coverageAmount).toLocaleString()}</span>
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">{policy.status.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No insurance policies</p>
                            )}
                        </div>

                        {/* Beneficiaries */}
                        <div className="card p-6">
                            <h2 className="text-lg font-bold mb-4">Beneficiaries</h2>
                            {member.beneficiaries.length > 0 ? (
                                <div className="space-y-4">
                                    {member.beneficiaries.map(ben => (
                                        <div key={ben.id} className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{ben.firstName} {ben.lastName}</p>
                                                <p className="text-xs text-gray-600">{ben.relationship.toUpperCase()}</p>
                                            </div>
                                            <span className="text-sm font-bold text-primary-600">{ben.allocationPercentage}%</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">No beneficiaries listed</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Update Warning Modal */}
                {showStatusModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl w-full max-w-md p-6">
                            <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-4 text-center">Critical Warning!</h3>
                            <p className="text-gray-600 mb-6 text-center">
                                You are about to mark this member as <span className="font-bold text-danger-700 uppercase">Deceased</span>.
                                <br /><br />
                                This action <span className="font-bold">cannot be easily undone</span> and will restrict the account significantly.
                                Reactivation to ACTIVE status is strictly prohibited once saved.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 btn btn-secondary"
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => performStatusUpdate(pendingStatus)}
                                    className="flex-1 btn bg-danger-600 hover:bg-danger-700 text-white"
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Updating...' : 'I Understand, Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
