'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '../../../../../components/layout/DashboardLayout';
import AdminSidebar from '../../../../../components/layout/AdminSidebar';
import Link from 'next/link';

interface Account {
    id: string;
    code: string;
    name: string;
    accountType: string;
    balance: number;
    description: string;
}

interface JournalEntry {
    id: string;
    transactionId: string;
    transactionDate: string;
    description: string;
    entryType: 'debit' | 'credit';
    amount: number;
    referenceNumber?: string;
}

export default function AccountLedgerPage() {
    const params = useParams();
    const accountId = params.id as string;

    const [account, setAccount] = useState<Account | null>(null);
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [recalculating, setRecalculating] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [accRes, glRes] = await Promise.all([
                fetch(`/api/admin/accounting/chart-of-accounts/${accountId}`),
                fetch(`/api/admin/accounting/general-ledger?accountId=${accountId}&limit=100`)
            ]);

            if (accRes.ok) setAccount(await accRes.json());
            if (glRes.ok) {
                const data = await glRes.json();
                setEntries(data.entries);
            }
        } catch (error) {
            console.error('Error fetching ledger data:', error);
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRecalculate = async () => {
        setRecalculating(true);
        try {
            const res = await fetch('/api/admin/accounting/recalculate', { method: 'POST' });
            if (res.ok) {
                await fetchData();
                alert('Balances recalculated successfully');
            }
        } catch (error) {
            console.error('Recalculation error:', error);
        } finally {
            setRecalculating(false);
        }
    };

    if (loading) return <DashboardLayout sidebar={<AdminSidebar />}><div className="p-8">Loading...</div></DashboardLayout>;
    if (!account) return <DashboardLayout sidebar={<AdminSidebar />}><div className="p-8 text-red-500 font-bold">Account not found</div></DashboardLayout>;

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Link href="/admin/accounting/coa" className="hover:text-primary-600">Chart of Accounts</Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">{account.code}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                            {account.name}
                            <span className={`text-sm px-3 py-1 rounded-full font-bold uppercase tracking-wider
                                ${account.accountType === 'asset' ? 'bg-blue-100 text-blue-700' :
                                    account.accountType === 'liability' ? 'bg-purple-100 text-purple-700' :
                                        account.accountType === 'equity' ? 'bg-green-100 text-green-700' :
                                            account.accountType === 'income' ? 'bg-emerald-100 text-emerald-700' :
                                                'bg-orange-100 text-orange-700'}`}>
                                {account.accountType}
                            </span>
                        </h1>
                        <p className="text-gray-500 mt-2 max-w-2xl">{account.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleRecalculate}
                            disabled={recalculating}
                            className="bg-white border border-gray-300 px-4 py-2 rounded-xl font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {recalculating ? 'Processing...' : 'Recalculate Balance'}
                        </button>
                        <button className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 transition-all">
                            Export Ledger
                        </button>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Balance</p>
                        <p className="text-4xl font-black text-gray-900">
                            KES {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Account ID: <span className="font-mono text-xs">{account.id}</span></p>
                        <p className="text-sm text-gray-500">Code: <span className="font-mono font-bold">{account.code}</span></p>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-extrabold text-gray-900">Account Ledger</h2>
                        <div className="text-sm text-gray-500 font-medium">Showing last 100 entries</div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Debit</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Credit</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium">
                                            No journal entries found for this account.
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map(entry => (
                                        <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">{new Date(entry.transactionDate).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{new Date(entry.transactionDate).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900 line-clamp-1">{entry.description}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">ID: {entry.transactionId}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {entry.entryType === 'debit' ? (
                                                    <span className="text-sm font-black text-blue-600">{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {entry.entryType === 'credit' ? (
                                                    <span className="text-sm font-black text-emerald-600">{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">{entry.referenceNumber || 'N/A'}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
