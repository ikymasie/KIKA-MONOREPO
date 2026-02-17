'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface JournalEntry {
    id: string;
    createdAt: string;
    description: string;
    entryType: 'debit' | 'credit';
    amount: number;
    account: {
        code: string;
        name: string;
    };
    transaction: {
        transactionNumber: string;
    };
}

export default function GLPage() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: '', endDate: '', accountId: '' });

    useEffect(() => {
        fetchGL();
    }, []);

    async function fetchGL() {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters as any).toString();
            const res = await fetch(`/api/admin/accounting/general-ledger?${query}`);
            const data = await res.json();
            setEntries(data);
        } catch (error) {
            console.error('Error fetching GL:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">General Ledger</h1>
                    <p className="text-gray-600">Complete transaction history and journal audit trail</p>
                </div>

                <div className="card p-6 mb-8 flex flex-wrap gap-4 items-end bg-white border border-gray-100 rounded-xl">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Start Date</label>
                        <input
                            type="date"
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                            value={filters.startDate}
                            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">End Date</label>
                        <input
                            type="date"
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                            value={filters.endDate}
                            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={fetchGL}
                        className="btn btn-primary px-6 py-2 rounded-lg font-bold"
                    >
                        Filter GL
                    </button>
                    <button
                        onClick={() => { setFilters({ startDate: '', endDate: '', accountId: '' }); fetchGL(); }}
                        className="px-6 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100"
                    >
                        Reset
                    </button>
                </div>

                <div className="card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Transaction #</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Account</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Debit</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4 h-12 bg-gray-50/50"></td>
                                    </tr>
                                ))
                            ) : entries.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 italic">No entries found for the selected period</td>
                                </tr>
                            ) : entries.map(entry => (
                                <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-xs font-mono text-gray-500">
                                        {new Date(entry.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-black text-indigo-600">
                                        {entry.transaction?.transactionNumber || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-black text-primary-500 uppercase tracking-tighter">{entry.account.code}</div>
                                        <div className="font-bold text-gray-900">{entry.account.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{entry.description}</td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-700">
                                        {entry.entryType === 'debit' ? `P ${Number(entry.amount).toLocaleString()}` : ''}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-rose-700">
                                        {entry.entryType === 'credit' ? `P ${Number(entry.amount).toLocaleString()}` : ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
