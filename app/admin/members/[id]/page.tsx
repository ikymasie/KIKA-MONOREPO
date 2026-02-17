'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import BeneficiaryModal from '@/components/admin/BeneficiaryModal';
import CommunicationModal from '@/components/admin/CommunicationModal';
import TicketModal from '@/components/admin/TicketModal';
import ClaimAssistModal from '@/components/admin/ClaimAssistModal';

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

    // Member Service States
    const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'tickets' | 'communications'>('overview');
    const [tickets, setTickets] = useState<any[]>([]);
    const [communications, setCommunications] = useState<any[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [commsLoading, setCommsLoading] = useState(false);

    // Modal Visibility
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [showCommModal, setShowCommModal] = useState(false);
    const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);

    useEffect(() => {
        fetchMemberDetails();
    }, [memberId]);

    useEffect(() => {
        if (activeTab === 'tickets') fetchTickets();
        if (activeTab === 'communications') fetchCommunications();
    }, [activeTab]);

    async function fetchTickets() {
        try {
            setTicketsLoading(true);
            const res = await fetch(`/api/admin/member-service/tickets?memberId=${memberId}`);
            const data = await res.json();
            setTickets(data.data || []);
        } catch (err) {
            console.error('Failed to fetch tickets', err);
        } finally {
            setTicketsLoading(false);
        }
    }

    async function fetchCommunications() {
        try {
            setCommsLoading(true);
            const res = await fetch(`/api/admin/member-service/communications?memberId=${memberId}`);
            const data = await res.json();
            setCommunications(data.data || []);
        } catch (err) {
            console.error('Failed to fetch communications', err);
        } finally {
            setCommsLoading(false);
        }
    }

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
                        <button onClick={() => setShowCommModal(true)} className="btn btn-secondary flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Log Comm
                        </button>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    <div className="card p-6 bg-blue-50">
                        <h3 className="text-sm font-medium text-blue-700 uppercase">Support Tickets</h3>
                        <p className="text-3xl font-bold text-blue-900">{member.kyc?.identityVerified ? 'Verified' : 'Pending'}</p>
                        <p className="text-xs text-blue-600 mt-1">KYC Status</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'overview' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('financials')}
                        className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'financials' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Financial Accounts
                    </button>
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'tickets' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Support Tickets
                    </button>
                    <button
                        onClick={() => setActiveTab('communications')}
                        className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'communications' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Communication History
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {activeTab === 'overview' && (
                            <>
                                {/* Profile Info */}
                                <div className="card p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl font-bold flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile Information
                                        </h2>
                                        <button className="text-primary-600 font-bold text-sm">Update Details</button>
                                    </div>
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
                                </div>

                                {/* Beneficiaries Section */}
                                <div className="card overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                        <h2 className="text-xl font-bold">Beneficiaries</h2>
                                        <button onClick={() => setShowBenModal(true)} className="btn btn-secondary btn-sm">Manage</button>
                                    </div>
                                    <div className="p-6">
                                        {member.beneficiaries.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {member.beneficiaries.map(ben => (
                                                    <div key={ben.id} className="p-4 border rounded-xl flex justify-between items-center">
                                                        <div>
                                                            <p className="font-bold text-gray-900">{ben.firstName} {ben.lastName}</p>
                                                            <p className="text-xs text-gray-500 uppercase">{ben.relationship}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-primary-600 font-bold">{ben.allocationPercentage}%</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 text-center py-4 italic">No beneficiaries listed</p>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'financials' && (
                            <>
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
                            </>
                        )}

                        {activeTab === 'tickets' && (
                            <div className="card p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold">Support Tickets</h2>
                                    <button onClick={() => setShowTicketModal(true)} className="btn btn-primary btn-sm">New Ticket</button>
                                </div>
                                <div className="space-y-4">
                                    {tickets.length > 0 ? tickets.map(ticket => (
                                        <div key={ticket.id} className="p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded-full ${ticket.status === 'open' ? 'bg-blue-100 text-blue-700' :
                                                    ticket.status === 'resolved' ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {ticket.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">{ticket.description}</p>
                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                                <span>Category: <span className="font-semibold text-gray-700">{ticket.category}</span></span>
                                                <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </div>
                                            <p className="text-gray-500">No support tickets found for this member</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'communications' && (
                            <div className="card p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold">Communication History</h2>
                                    <button onClick={() => setShowCommModal(true)} className="btn btn-secondary btn-sm">Log Manual Interaction</button>
                                </div>
                                <div className="space-y-6">
                                    {communications.length > 0 ? communications.map(comm => (
                                        <div key={comm.id} className="flex gap-4">
                                            <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${comm.type === 'call' ? 'bg-green-100 text-green-600' :
                                                comm.type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {comm.type === 'call' ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                )}
                                            </div>
                                            <div className="flex-1 pb-6 border-b border-gray-100 last:border-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-gray-900">{comm.subject || comm.type.toUpperCase()}</h4>
                                                    <span className="text-xs text-gray-500">{new Date(comm.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{comm.content}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${comm.direction === 'inbound' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                                        {comm.direction.toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">Recorded by: {comm.recordedBy?.firstName} {comm.recordedBy?.lastName}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12 text-gray-500">No communication logs found</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Member Actions */}
                        <div className="card p-6 border-2 border-primary-100">
                            <h2 className="text-lg font-bold mb-4">Rep Assistance</h2>
                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={() => setShowClaimModal(true)}
                                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Submit Insurance Claim
                                </button>
                                <button
                                    onClick={() => setShowTicketModal(true)}
                                    className="w-full btn btn-secondary flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Open Support Ticket
                                </button>
                                <button className="w-full btn btn-outline flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generate Statement
                                </button>
                            </div>
                        </div>

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
                    </div>
                </div>

                {/* Status Update Warning Modal */}
                {showStatusModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl w-full max-w-md p-6 border-b-8 border-danger-600 relative overflow-hidden">
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
                {/* Modals */}
                {showBeneficiaryModal && (
                    <BeneficiaryModal
                        memberId={memberId}
                        existingBeneficiaries={member.beneficiaries}
                        onClose={() => setShowBeneficiaryModal(false)}
                        onSuccess={fetchMemberDetails}
                    />
                )}

                {showCommModal && (
                    <CommunicationModal
                        memberId={memberId}
                        onClose={() => setShowCommModal(false)}
                        onSuccess={fetchCommunications}
                    />
                )}

                {showTicketModal && (
                    <TicketModal
                        memberId={memberId}
                        onClose={() => setShowTicketModal(false)}
                        onSuccess={fetchTickets}
                    />
                )}

                {showClaimModal && (
                    <ClaimAssistModal
                        memberId={memberId}
                        policies={member.insurancePolicies}
                        onClose={() => setShowClaimModal(false)}
                        onSuccess={() => {
                            fetchMemberDetails();
                            alert('Claim submitted successfully. Track it in the Insurance section.');
                        }}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
