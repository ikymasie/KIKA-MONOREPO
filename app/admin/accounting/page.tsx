'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Link from 'next/link';

interface AccountingMetrics {
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    netIncome: number;
}

export default function AccountingDashboard() {
    const [metrics, setMetrics] = useState<AccountingMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                // Fetch Balance Sheet for assets/liabilities/equity
                const bsRes = await fetch('/api/admin/accounting/financial-statements?type=balance-sheet');
                const bsData = await bsRes.json();

                // Fetch Income Statement for net income
                const isRes = await fetch('/api/admin/accounting/financial-statements?type=income-statement');
                const isData = await isRes.json();

                setMetrics({
                    totalAssets: bsData.totalAssets || 0,
                    totalLiabilities: bsData.totalLiabilities || 0,
                    totalEquity: bsData.totalEquity || 0,
                    netIncome: isData.netIncome || 0
                });
            } catch (error) {
                console.error('Error fetching accounting metrics:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    const menuItems = [
        { name: 'Chart of Accounts', description: 'Manage your accounts and COA structure', href: '/admin/accounting/coa', icon: '📋' },
        { name: 'General Ledger', description: 'View all journal entries and transaction history', href: '/admin/accounting/gl', icon: '📖' },
        { name: 'Journal Entries', description: 'Create and manage manual journal entries', href: '/admin/accounting/journals/new', icon: '✍️' },
        { name: 'Financial Statements', description: 'Generate Balance Sheets, Income Statements, and Trial Balances', href: '/admin/accounting/statements', icon: '📊' },
        { name: 'Vendor Payments', description: 'Process and track payments to vendors', href: '/admin/accounting/payments', icon: '💸' },
        { name: 'Bank Reconciliation', description: 'Match bank statements with internal records', href: '/admin/accounting/bank-rec', icon: '🔄' },
    ];

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Accounting Command Center</h1>
                    <p className="text-gray-600">Overview of financial health and accounting operations</p>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card p-6 bg-white shadow-sm border border-gray-100 rounded-xl">
                        <div className="text-sm font-medium text-gray-500 mb-1">Total Assets</div>
                        <div className={`text-2xl font-bold ${loading ? 'animate-pulse bg-gray-200 h-8 w-32 rounded' : 'text-primary-700'}`}>
                            {!loading && `P ${metrics?.totalAssets.toLocaleString()}`}
                        </div>
                    </div>
                    <div className="card p-6 bg-white shadow-sm border border-gray-100 rounded-xl">
                        <div className="text-sm font-medium text-gray-500 mb-1">Total Liabilities</div>
                        <div className={`text-2xl font-bold ${loading ? 'animate-pulse bg-gray-200 h-8 w-32 rounded' : 'text-danger-600'}`}>
                            {!loading && `P ${metrics?.totalLiabilities.toLocaleString()}`}
                        </div>
                    </div>
                    <div className="card p-6 bg-white shadow-sm border border-gray-100 rounded-xl">
                        <div className="text-sm font-medium text-gray-500 mb-1">Total Equity</div>
                        <div className={`text-2xl font-bold ${loading ? 'animate-pulse bg-gray-200 h-8 w-32 rounded' : 'text-success-600'}`}>
                            {!loading && `P ${metrics?.totalEquity.toLocaleString()}`}
                        </div>
                    </div>
                    <div className="card p-6 bg-white shadow-sm border border-gray-100 rounded-xl">
                        <div className="text-sm font-medium text-gray-500 mb-1">Net Income (Current Period)</div>
                        <div className={`text-2xl font-bold ${loading ? 'animate-pulse bg-gray-200 h-8 w-32 rounded' : 'text-indigo-600'}`}>
                            {!loading && `P ${metrics?.netIncome.toLocaleString()}`}
                        </div>
                    </div>
                </div>

                {/* Management Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300"
                        >
                            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{item.name}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                            <div className="mt-6 flex items-center text-primary-600 font-bold text-sm tracking-widest uppercase">
                                Open Module
                                <span className="ml-2 group-hover:translate-x-2 transition-transform duration-300">→</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
