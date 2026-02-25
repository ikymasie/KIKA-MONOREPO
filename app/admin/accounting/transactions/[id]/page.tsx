'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Hash,
    Calendar,
    Type,
    FileText,
    User,
    CheckCircle2,
    Clock,
    XCircle,
    Download
} from 'lucide-react';
import { format } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface JournalEntry {
    id: string;
    accountId: string;
    accountCode: string;
    accountName: string;
    entryType: 'debit' | 'credit';
    amount: number;
    description: string;
    createdAt: string;
}

interface TransactionDetail {
    id: string;
    transactionNumber: string;
    transactionType: string;
    amount: number;
    transactionDate: string;
    description: string;
    status: string;
    referenceNumber: string;
    memberId?: string;
    firstName?: string;
    lastName?: string;
    memberNumber?: string;
    entries: JournalEntry[];
}

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<TransactionDetail | null>(null);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const response = await fetch(`/api/admin/accounting/transactions/${params.id}`);
                const result = await response.json();
                if (result.success) {
                    setData(result.data);
                } else {
                    setError(result.error || 'Failed to fetch transaction details');
                }
            } catch (err) {
                setError('An error occurred while fetching data');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchTransaction();
        }
    }, [params.id]);

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'posted':
            case 'completed':
                return <CheckCircle2 className="text-green-500" size={20} />;
            case 'pending':
                return <Clock className="text-amber-500" size={20} />;
            case 'failed':
            case 'cancelled':
                return <XCircle className="text-red-500" size={20} />;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="mt-4 text-gray-600 font-medium">Loading transaction details...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8">
                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-12 text-center border border-red-100">
                        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-8">{error || 'Transaction not found'}</p>
                        <button onClick={() => router.back()} className="btn btn-primary px-8">Go Back</button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8 bg-gray-50 min-h-screen animate-in fade-in duration-500">
                {/* Header */}
                <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4 group font-medium"
                        >
                            <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={18} />
                            Back to Previous Screen
                        </button>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Transaction <span className="text-primary-600">#{data.transactionNumber}</span>
                            </h1>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${data.status === 'posted' || data.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                                }`}>
                                {getStatusIcon(data.status)}
                                {data.status}
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm font-medium">
                            System ID: <span className="font-mono text-xs">{data.id}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition-all font-bold">
                            <Download size={18} />
                            Export Receipt
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-400 mb-3">
                                    <Calendar size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Date & Time</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">{format(new Date(data.transactionDate), 'MMM dd, yyyy')}</div>
                                <div className="text-xs text-gray-400 font-medium">{format(new Date(data.transactionDate), 'HH:mm:ss')}</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-400 mb-3">
                                    <Type size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Transaction Type</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 capitalize">{data.transactionType.replace('_', ' ')}</div>
                                <div className="text-xs text-gray-400 font-medium">System Classification</div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-400 mb-3">
                                    <Hash size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Reference</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 truncate">{data.referenceNumber || 'N/A'}</div>
                                <div className="text-xs text-gray-400 font-medium uppercase tracking-tighter">External/Internal Ref</div>
                            </div>
                        </div>

                        {/* Journal Entries Table (Double Entry) */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 uppercase tracking-tight">
                                    <FileText size={20} className="text-primary-500" />
                                    Double-Entry Audit Trail
                                </h3>
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full uppercase">Accounting Ledger</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/30">
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Debit (P)</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Credit (P)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data.entries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-black text-primary-600 uppercase tracking-tighter">{entry.accountCode}</div>
                                                    <div className="font-bold text-gray-900">{entry.accountName}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 italic">
                                                    {entry.description || data.description}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {entry.entryType === 'debit' && (
                                                        <span className="text-indigo-600 font-bold tabular-nums">
                                                            {Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {entry.entryType === 'credit' && (
                                                        <span className="text-rose-600 font-bold tabular-nums">
                                                            {Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50/80 font-black">
                                            <td colSpan={2} className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-gray-400">Total Balanced</td>
                                            <td className="px-6 py-4 text-right text-indigo-700 underline decoration-2 underline-offset-4">
                                                {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-rose-700 underline decoration-2 underline-offset-4">
                                                {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Additional Info */}
                    <div className="space-y-8">
                        {/* Amount Card */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-xl text-white">
                            <span className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Transaction Total</span>
                            <div className="text-4xl font-black mt-2 mb-4 tabular-nums tracking-tighter text-primary-400">
                                P {data.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 w-full animate-pulse"></div>
                            </div>
                            <p className="mt-4 text-xs text-gray-400 leading-relaxed font-medium capitalize">
                                This {data.transactionType.replace('_', ' ')} has been fully processed and reconciled against the general ledger.
                            </p>
                        </div>

                        {/* Description & Notes */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Internal Description</h4>
                            <p className="text-gray-900 font-medium leading-relaxed">{data.description || 'No description provided for this transaction.'}</p>
                        </div>

                        {/* Member Info if associated */}
                        {data.memberId && (
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-3 text-gray-400 mb-6">
                                    <User size={18} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Associated Member</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 font-black text-lg">
                                        {data.firstName?.[0]}{data.lastName?.[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 uppercase tracking-tight leading-none mb-1">{data.firstName} {data.lastName}</div>
                                        <div className="text-xs font-mono text-gray-400">#{data.memberNumber}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/admin/members/${data.memberId}`)}
                                    className="w-full mt-6 py-2 px-4 border border-primary-100 text-primary-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-50 transition-colors"
                                >
                                    View Profile
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
