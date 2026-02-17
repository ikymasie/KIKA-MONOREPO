'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { format } from 'date-fns';

interface Transaction {
    id: string;
    amount: number;
    transactionType: string;
    status: string;
    description: string;
    transactionNumber: string;
    createdAt: string;
}

export default function MemberStatementsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        async function fetchTransactions() {
            try {
                const response = await fetch('/api/member/transactions');
                if (!response.ok) throw new Error('Failed to fetch transaction history');
                const data = await response.json();
                setTransactions(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchTransactions();
    }, []);

    const handleExportCSV = () => {
        setIsExporting(true);
        try {
            const headers = ['Date', 'Description', 'Reference', 'Type', 'Amount', 'Status'];
            const rows = transactions.map(t => [
                new Date(t.createdAt).toLocaleDateString(),
                t.description || '',
                t.transactionNumber,
                t.transactionType.toUpperCase(),
                Number(t.amount).toFixed(2),
                t.status.toUpperCase()
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `Transaction_Statement_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            alert('Failed to export CSV');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Statements</h1>
                        <p className="text-gray-600">Your complete financial transaction history</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                            📅 Filter Date
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting || loading}
                            className="btn btn-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            {isExporting ? 'Exporting...' : '📥 Export CSV'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="card animate-pulse h-64 bg-gray-100"></div>
                ) : error ? (
                    <div className="card p-6 bg-danger-50 text-danger-700">{error}</div>
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 italic bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Reference</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{tx.description}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.transactionNumber}</td>
                                        <td className="px-6 py-4 text-sm font-medium uppercase text-gray-600">{tx.transactionType}</td>
                                        <td className={`px-6 py-4 text-right font-black ${['withdrawal', 'loan_repayment', 'fee', 'insurance_premium'].includes(tx.transactionType.toLowerCase()) ? 'text-danger-600' : 'text-success-600'}`}>
                                            {['withdrawal', 'loan_repayment', 'fee', 'insurance_premium'].includes(tx.transactionType.toLowerCase()) ? '-' : '+'} P {Number(tx.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${tx.status === 'completed' ? 'bg-success-100 text-success-700' :
                                                tx.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                                                    'bg-danger-100 text-danger-700'
                                                }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                                            No transactions found in this period.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
