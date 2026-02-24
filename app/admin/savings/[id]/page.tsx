'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    DollarSign,
    Activity,
    Info,
    TrendingUp,
    Download,
    Plus
} from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
    id: string;
    amount: number;
    transactionType: string;
    description: string;
    createdAt: string;
}

interface SavingsDetail {
    id: string;
    memberId: string;
    firstName: string;
    lastName: string;
    memberNumber: string;
    productName: string;
    productCode: string;
    balance: number;
    monthlyContribution: number;
    productInterestRate: number;
    isActive: boolean;
    isShareCapital: boolean;
    allowWithdrawals: boolean;
    transactions: Transaction[];
}

export default function SavingsDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<SavingsDetail | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`/api/admin/savings/${params.id}`);
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    setError(result.error || 'Failed to fetch account details');
                }
            } catch (err) {
                setError('An error occurred while fetching data');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 font-medium">Loading account details...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 bg-gray-50 min-h-screen">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-12 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Account</h2>
                    <p className="text-gray-600 mb-8">{error || 'The requested savings account could not be found.'}</p>
                    <button
                        onClick={() => router.back()}
                        className="btn btn-primary px-8"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen animate-in fade-in duration-500">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4 group"
                    >
                        <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Savings List
                    </button>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-bold text-gray-900">{data.productName}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${data.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {data.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {data.isShareCapital && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                Share Capital
                            </span>
                        )}
                    </div>
                    <p className="text-gray-500 text-lg">
                        Member: <span className="text-gray-900 font-semibold">{data.firstName} {data.lastName}</span>
                        <span className="mx-2">•</span>
                        ID: <span className="text-gray-900 font-medium">{data.memberNumber}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-all font-medium">
                        <Download />
                        Statement
                    </button>
                    <button className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-primary-700 transition-all font-bold">
                        <Plus />
                        Transaction
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Metrics Section */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Balance Card */}
                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-8 shadow-xl text-white">
                            <div className="flex items-center justify-between mb-8">
                                <span className="text-primary-100 font-medium tracking-wide uppercase text-sm">Current Balance</span>
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <DollarSign size={20} />
                                </div>
                            </div>
                            <h2 className="text-5xl font-black mb-2 tabular-nums tracking-tight">
                                P{data.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                            <p className="text-primary-100 opacity-80">Last updated: {format(new Date(), 'MMM dd, HH:mm')}</p>
                        </div>

                        {/* Details Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="text-primary-500" />
                                Account Details
                            </h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center group">
                                    <span className="text-gray-500 font-medium">Interest Rate</span>
                                    <span className="text-gray-900 font-bold bg-gray-50 px-3 py-1 rounded-lg group-hover:bg-primary-50 transition-colors">
                                        {data.productInterestRate}% p.a.
                                    </span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-gray-500 font-medium">Monthly Contrib.</span>
                                    <span className="text-gray-900 font-bold bg-gray-50 px-3 py-1 rounded-lg group-hover:bg-primary-50 transition-colors">
                                        P{data.monthlyContribution.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-gray-500 font-medium">Wthdrawals</span>
                                    <span className={`font-bold ${data.allowWithdrawals ? 'text-green-600' : 'text-amber-600'}`}>
                                        {data.allowWithdrawals ? 'Allowed' : 'Restricted'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-gray-500 font-medium">Product Code</span>
                                    <span className="text-gray-900 font-mono font-bold bg-gray-50 px-3 py-1 rounded-lg">
                                        {data.productCode}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-full">
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="text-primary-500" />
                                    Transaction History
                                </h3>
                                <div className="bg-gray-50 px-4 py-1 rounded-full text-xs font-bold text-gray-500 uppercase">
                                    Latest 50 Entries
                                </div>
                            </div>

                            {data.transactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                                                <th className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.transactions.map((t) => (
                                                <tr key={t.id} className="hover:bg-gray-50/80 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="text-gray-900 font-semibold">{format(new Date(t.createdAt), 'MMM dd, yyyy')}</div>
                                                        <div className="text-gray-400 text-xs">{format(new Date(t.createdAt), 'HH:mm')}</div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-gray-900 font-medium line-clamp-1">{t.description}</p>
                                                        <p className="text-gray-400 text-xs capitalize">{t.transactionType.replace('_', ' ')}</p>
                                                    </td>
                                                    <td className={`px-8 py-5 text-right font-bold text-lg tabular-nums ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-20 text-center">
                                    <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Activity size={40} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h4>
                                    <p className="text-gray-500 max-w-xs mx-auto">This account doesn't have any transaction history to display at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
