'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function StatementsPage() {
    const [type, setType] = useState<'balance-sheet' | 'income-statement'>('balance-sheet');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatement();
    }, [type]);

    async function fetchStatement() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/accounting/financial-statements?type=${type}`);
            const data = await res.json();
            setData(data);
        } catch (error) {
            console.error('Error fetching statement:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Statements</h1>
                        <p className="text-gray-600">Generated real-time reports based on General Ledger data</p>
                    </div>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setType('balance-sheet')}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${type === 'balance-sheet' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Balance Sheet
                        </button>
                        <button
                            onClick={() => setType('income-statement')}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${type === 'income-statement' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Income Statement
                        </button>
                    </div>
                </div>

                <div className="card p-8 bg-white border border-gray-100 rounded-3xl shadow-xl min-h-[600px]">
                    <div className="text-center mb-12 border-b border-gray-100 pb-8">
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-1">
                            {type === 'balance-sheet' ? 'Statement of Financial Position' : 'Statement of Comprehensive Income'}
                        </h2>
                        <p className="text-gray-500 font-mono text-sm uppercase">As of {new Date().toLocaleDateString()}</p>
                    </div>

                    {loading ? (
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-10 bg-gray-50 animate-pulse rounded-lg"></div>)}
                        </div>
                    ) : type === 'balance-sheet' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* Assets */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-sm font-black text-primary-600 uppercase tracking-[0.2em] mb-4 border-b-2 border-primary-100 pb-2">Assets</h3>
                                    <div className="space-y-4">
                                        {data.assets.map((a: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-600 font-medium">{a.name}</span>
                                                <span className="font-bold text-gray-900">P {Number(a.balance).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 pt-4 border-t-2 border-gray-900 flex justify-between font-black">
                                        <span>TOTAL ASSETS</span>
                                        <span>P {data.totalAssets.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Liabilities & Equity */}
                            <div className="space-y-12">
                                <div>
                                    <h3 className="text-sm font-black text-danger-600 uppercase tracking-[0.2em] mb-4 border-b-2 border-danger-100 pb-2">Liabilities</h3>
                                    <div className="space-y-4">
                                        {data.liabilities.map((a: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-600 font-medium">{a.name}</span>
                                                <span className="font-bold text-gray-900">P {Number(a.balance).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold">
                                        <span>Total Liabilities</span>
                                        <span>P {data.totalLiabilities.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-success-600 uppercase tracking-[0.2em] mb-4 border-b-2 border-success-100 pb-2">Equity</h3>
                                    <div className="space-y-4">
                                        {data.equity.map((a: any, i: number) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-600 font-medium">{a.name}</span>
                                                <span className="font-bold text-gray-900">P {Number(a.balance).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold">
                                        <span>Total Equity</span>
                                        <span>P {data.totalEquity.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t-4 border-double border-gray-900 flex justify-between font-black text-lg">
                                    <span>TOTAL LIABILITIES & EQUITY</span>
                                    <span>P {(data.totalLiabilities + data.totalEquity).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-12">
                            <div>
                                <h3 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 border-b-2 border-emerald-100 pb-2">Revenue</h3>
                                <div className="space-y-4">
                                    {data.revenue.map((a: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-gray-600 font-medium">{a.name}</span>
                                            <span className="font-bold text-gray-900">P {Number(a.balance).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold">
                                    <span>Total Revenue</span>
                                    <span>P {data.totalRevenue.toLocaleString()}</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-rose-600 uppercase tracking-[0.2em] mb-4 border-b-2 border-rose-100 pb-2">Expenses</h3>
                                <div className="space-y-4">
                                    {data.expenses.map((a: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-gray-600 font-medium">{a.name}</span>
                                            <span className="font-bold text-gray-900">P {Number(a.balance).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold">
                                    <span>Total Expenses</span>
                                    <span>P {data.totalExpenses.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="pt-8 border-t-4 border-double border-gray-900 flex justify-between font-black text-2xl text-primary-700">
                                <span className="uppercase tracking-tighter">Net Income / (Loss)</span>
                                <span>P {data.netIncome.toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
