'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { format } from 'date-fns';

interface SavingAccount {
    id: string;
    balance: number;
    monthlyContribution: number;
    isActive: boolean;
    member: {
        firstName: string;
        lastName: string;
        memberNumber: string;
    };
    product: {
        name: string;
        code: string;
    };
    createdAt: string;
}

interface Metrics {
    totalSavings: number;
    activeAccounts: number;
}

export default function AdminSavingsPage() {
    const [savings, setSavings] = useState<SavingAccount[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/admin/savings');
                if (!response.ok) throw new Error('Failed to fetch savings data');
                const result = await response.json();
                setSavings(result.savings);
                setMetrics(result.metrics);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Member Savings</h1>
                        <p className="text-gray-600">Manage all member savings accounts and products</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => window.location.href = '/admin/savings/products'}
                            className="btn border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 rounded-lg"
                        >
                            Savings Products
                        </button>
                        <button className="btn btn-primary px-4 py-2 rounded-lg font-semibold">
                            + New Saving Account
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="animate-pulse">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>)}
                        </div>
                        <div className="h-64 bg-gray-50 rounded-xl"></div>
                    </div>
                ) : error ? (
                    <div className="card p-6 bg-danger-50 text-danger-700">{error}</div>
                ) : (
                    <>
                        {/* Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="card p-6 border-l-4 border-primary-500">
                                <div className="text-sm font-medium text-gray-500 mb-1">Total Savings Pool</div>
                                <div className="text-3xl font-bold text-gray-900">P {metrics?.totalSavings.toLocaleString()}</div>
                            </div>
                            <div className="card p-6 border-l-4 border-success-500">
                                <div className="text-sm font-medium text-gray-500 mb-1">Active Accounts</div>
                                <div className="text-3xl font-bold text-gray-900">{metrics?.activeAccounts}</div>
                            </div>
                        </div>

                        {/* Accounts List */}
                        <div className="card overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <h2 className="font-bold text-gray-900">All Savings Accounts</h2>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    />
                                    <span className="absolute left-2.5 top-2.5 text-gray-400">🔍</span>
                                </div>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Member</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Product</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Balance</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Monthly</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {savings.map(acc => (
                                        <tr key={acc.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{acc.member.firstName} {acc.member.lastName}</div>
                                                <div className="text-xs text-gray-500">#{acc.member.memberNumber}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-800">{acc.product.name}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase">{acc.product.code}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-gray-900">
                                                P {Number(acc.balance).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-primary-600">
                                                P {Number(acc.monthlyContribution).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${acc.isActive ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {acc.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-primary-600 font-bold hover:text-primary-700 text-xs">Manage</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
