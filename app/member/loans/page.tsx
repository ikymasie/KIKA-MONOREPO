'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { format } from 'date-fns';
import Link from 'next/link';

interface Loan {
    id: string;
    loanNumber: string;
    principalAmount: number;
    outstandingBalance: number;
    interestRate: number;
    status: string;
    createdAt: string;
    maturityDate: string | null;
    product: {
        name: string;
    };
}

export default function MemberLoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLoans() {
            try {
                const response = await fetch('/api/member/loans');
                if (!response.ok) throw new Error('Failed to fetch loans');
                const data = await response.json();
                setLoans(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchLoans();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'disbursed':
                return 'bg-success-100 text-success-700';
            case 'pending':
            case 'under_appraisal':
                return 'bg-warning-100 text-warning-700';
            case 'rejected':
            case 'defaulted':
                return 'bg-danger-100 text-danger-700';
            case 'paid_off':
                return 'bg-primary-100 text-primary-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-outfit">My Loans</h1>
                        <p className="text-gray-600">View and manage your loan applications and active balances</p>
                    </div>
                    <Link href="/member/apply-loan" className="btn btn-primary">
                        Apply for New Loan
                    </Link>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : error ? (
                    <div className="card p-6 bg-danger-50 text-danger-700 border-danger-200">
                        {error}
                    </div>
                ) : loans.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="text-5xl mb-4">💰</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No loans found</h3>
                        <p className="text-gray-600 mb-6">You haven't applied for any loans yet.</p>
                        <Link href="/member/apply-loan" className="btn btn-primary inline-block">
                            Start Application
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {loans.map((loan) => (
                            <div key={loan.id} className="card p-6 hover:shadow-md transition-shadow border-l-4 border-l-primary-500">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-sm font-bold text-primary-600 uppercase tracking-wider">{loan.product.name}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusColor(loan.status)}`}>
                                                {loan.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">#{loan.loanNumber}</h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Principal</p>
                                                <p className="font-semibold text-gray-900">P {Number(loan.principalAmount).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Balance</p>
                                                <p className="font-semibold text-primary-700">P {Number(loan.outstandingBalance).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Interest</p>
                                                <p className="font-semibold text-gray-900">{loan.interestRate}%</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Applied On</p>
                                                <p className="font-semibold text-gray-900">{format(new Date(loan.createdAt), 'MMM dd, yyyy')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Link
                                            href={`/member/loans/${loan.id}`}
                                            className="w-full md:w-auto px-6 py-2 border border-primary-600 text-primary-600 font-bold rounded-xl hover:bg-primary-50 transition-colors text-center"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                                {loan.status === 'active' && loan.maturityDate && (
                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600">Repayment Progress</span>
                                            <span className="text-sm font-bold text-gray-900">
                                                {Math.round((1 - (loan.outstandingBalance / loan.principalAmount)) * 100)}% Repaid
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${(1 - (loan.outstandingBalance / loan.principalAmount)) * 100}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">Maturity Date: {format(new Date(loan.maturityDate), 'MMMM dd, yyyy')}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
