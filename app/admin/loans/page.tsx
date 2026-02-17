'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface LoanData {
    id: string;
    loanNumber: string;
    member: {
        id: string;
        memberNumber: string;
        fullName: string;
    };
    product: {
        name: string;
        code: string;
    };
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyInstallment: number;
    totalAmountDue: number;
    outstandingBalance: number;
    amountPaid: number;
    status: string;
    applicationDate: string;
    approvalDate?: string;
    disbursementDate?: string;
    guarantorsCount: number;
    isPastDue: boolean;
}

interface LoansResponse {
    loans: LoanData[];
    stats: {
        total: number;
        pending: number;
        approved: number;
        active: number;
        disbursed: number;
        rejected: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function LoansPage() {
    const router = useRouter();
    const [data, setData] = useState<LoansResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        fetchLoans();
    }, [page, status]);

    async function fetchLoans() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });

            if (status) params.append('status', status);
            if (search) params.append('search', search);

            const response = await fetch(`/api/admin/loans?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch loans');
            }
            const result = await response.json();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setPage(1);
        fetchLoans();
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
            case 'paid_off':
                return 'bg-gray-100 text-gray-700';
            case 'rejected':
                return 'bg-danger-100 text-danger-700';
            case 'defaulted':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
                    <p className="text-gray-600 mt-1">Manage loan applications and disbursements</p>
                </div>

                {/* Stats Cards */}
                {data && (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                        <div className="card p-4">
                            <div className="text-xs font-medium text-gray-600 mb-1">Total</div>
                            <div className="text-2xl font-bold text-gray-900">{data.stats.total}</div>
                        </div>
                        <div className="card p-4 border-l-4 border-amber-500">
                            <div className="text-xs font-medium text-gray-600 mb-1">Pending</div>
                            <div className="text-2xl font-bold text-amber-700">{data.stats.pending}</div>
                        </div>
                        <div className="card p-4 border-l-4 border-blue-500">
                            <div className="text-xs font-medium text-gray-600 mb-1">Approved</div>
                            <div className="text-2xl font-bold text-blue-700">{data.stats.approved}</div>
                        </div>
                        <div className="card p-4 border-l-4 border-indigo-500">
                            <div className="text-xs font-medium text-gray-600 mb-1">Disbursed</div>
                            <div className="text-2xl font-bold text-indigo-700">{data.stats.disbursed}</div>
                        </div>
                        <div className="card p-4 border-l-4 border-success-500">
                            <div className="text-xs font-medium text-gray-600 mb-1">Active</div>
                            <div className="text-2xl font-bold text-success-700">{data.stats.active}</div>
                        </div>
                        <div className="card p-4 border-l-4 border-danger-500">
                            <div className="text-xs font-medium text-gray-600 mb-1">Rejected</div>
                            <div className="text-2xl font-bold text-danger-700">{data.stats.rejected}</div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="card p-6 mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by member name, member number, or loan number..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="disbursed">Disbursed</option>
                            <option value="active">Active</option>
                            <option value="paid_off">Paid Off</option>
                            <option value="rejected">Rejected</option>
                            <option value="defaulted">Defaulted</option>
                        </select>
                        <button type="submit" className="btn btn-primary">
                            Search
                        </button>
                    </form>
                </div>

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                        <p className="text-danger-700">Error: {error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="card p-6">
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-20 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Loans Table */}
                {!loading && data && (
                    <>
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Loan #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Member
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Term
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Applied
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.loans.length > 0 ? (
                                            data.loans.map((loan) => (
                                                <tr key={loan.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {loan.loanNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {loan.member.fullName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{loan.member.memberNumber}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {loan.product.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            P {loan.principalAmount.toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {loan.interestRate}% interest
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {loan.termMonths} months
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(loan.status)}`}>
                                                            {loan.status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                        {loan.isPastDue && (
                                                            <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-700">
                                                                OVERDUE
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(loan.applicationDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => router.push(`/admin/loans/${loan.id}`)}
                                                            className="text-primary-600 hover:text-primary-900"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                    No loans found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {data.pagination.totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(page - 1) * data.pagination.limit + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(page * data.pagination.limit, data.pagination.total)}
                                    </span>{' '}
                                    of <span className="font-medium">{data.pagination.total}</span> loans
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === data.pagination.totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
