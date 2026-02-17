'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorSidebar from '@/components/layout/VendorSidebar';

interface Payment {
    id: string;
    transactionNumber: string;
    amount: number;
    transactionDate: string;
    description: string;
    status: string;
}

export default function VendorPayments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await fetch('/api/vendor/payments');
            const data = await res.json();
            setPayments(data);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout sidebar={<VendorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Payment History</h1>
                    <p className="text-slate-500 font-medium text-lg">Monitor disbursements received from SACCOs.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="glass-panel p-8 bg-green-50 border-green-200">
                        <div className="text-xs font-black text-green-600 uppercase tracking-widest mb-4">Total Received</div>
                        <div className="text-5xl font-black text-slate-900 mb-2">
                            N$ {payments.reduce((acc, p) => acc + Number(p.amount), 0).toLocaleString()}
                        </div>
                        <div className="text-sm font-bold text-slate-500">Across {payments.length} transactions</div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payments.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No payment history found.
                                    </td>
                                </tr>
                            ) : (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-6 font-black text-slate-900">
                                            #{payment.transactionNumber}
                                        </td>
                                        <td className="px-6 py-6 text-sm text-slate-600 font-medium">
                                            {new Date(payment.transactionDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-6 text-sm text-slate-600">
                                            {payment.description}
                                        </td>
                                        <td className="px-6 py-6 font-black text-slate-900">
                                            N$ {Number(payment.amount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                                {payment.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
