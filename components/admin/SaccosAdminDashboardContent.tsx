'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCompactNumber, formatRelativeTime } from '@/lib/dashboard-utils';

interface DashboardData {
    metrics: {
        totalMembers: number;
        totalSavings: number;
        activeLoans: number;
        liquidityRatio: number;
    };
    pendingApprovals: Array<{
        type: string;
        name: string;
        amount: number;
        details: string;
        id: string;
    }>;
    recentTransactions: Array<{
        type: string;
        description: string;
        amount: number;
        date: string;
        member: string;
    }>;
}

export default function SaccosAdminDashboardContent() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch('/api/admin/dashboard');
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }
                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                            <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mb-8 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-danger-700">Error loading dashboard: {error}</p>
            </div>
        );
    }

    return (
        <>
            {/* Key Metrics */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card p-6">
                        <div className="text-sm font-medium text-gray-600 mb-2">Total Members</div>
                        <div className="text-3xl font-bold text-primary-700">{data?.metrics.totalMembers.toLocaleString()}</div>
                        <div className="text-xs text-gray-600 mt-2">Active members</div>
                    </div>
                    <div className="card p-6">
                        <div className="text-sm font-medium text-gray-600 mb-2">Total Savings</div>
                        <div className="text-3xl font-bold text-primary-700">{formatCompactNumber(data?.metrics.totalSavings || 0)}</div>
                        <div className="text-xs text-gray-600 mt-2">Across all products</div>
                    </div>
                    <div className="card p-6">
                        <div className="text-sm font-medium text-gray-600 mb-2">Active Loans</div>
                        <div className="text-3xl font-bold text-primary-700">{formatCompactNumber(data?.metrics.activeLoans || 0)}</div>
                        <div className="text-xs text-gray-600 mt-2">Outstanding balance</div>
                    </div>
                    <div className="card p-6">
                        <div className="text-sm font-medium text-gray-600 mb-2">Liquidity Ratio</div>
                        <div className={`text-3xl font-bold ${(data?.metrics.liquidityRatio || 0) >= 10 ? 'text-success-700' : 'text-warning-700'}`}>
                            {data?.metrics.liquidityRatio}%
                        </div>
                        <div className="text-xs text-gray-600 mt-2">Target: 10%</div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={() => router.push('/admin/members')}
                        className="card p-4 hover:shadow-lg transition-shadow text-left"
                    >
                        <div className="text-2xl mb-2">👥</div>
                        <div className="font-semibold">Members</div>
                        <div className="text-sm text-gray-600">Manage members</div>
                    </button>
                    <button
                        onClick={() => router.push('/admin/loans')}
                        className="card p-4 hover:shadow-lg transition-shadow text-left"
                    >
                        <div className="text-2xl mb-2">💰</div>
                        <div className="font-semibold">Loans</div>
                        <div className="text-sm text-gray-600">Process applications</div>
                    </button>
                    <button
                        onClick={() => router.push('/admin/deductions')}
                        className="card p-4 hover:shadow-lg transition-shadow text-left"
                    >
                        <div className="text-2xl mb-2">📊</div>
                        <div className="font-semibold">Deductions</div>
                        <div className="text-sm text-gray-600">Generate CSV</div>
                    </button>
                    <button
                        onClick={() => router.push('/admin/reports')}
                        className="card p-4 hover:shadow-lg transition-shadow text-left"
                    >
                        <div className="text-2xl mb-2">📈</div>
                        <div className="font-semibold">Reports</div>
                        <div className="text-sm text-gray-600">Financial statements</div>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pending Approvals */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-4">Pending Approvals</h2>
                    {data && data.pendingApprovals.length > 0 ? (
                        <div className="space-y-3">
                            {data.pendingApprovals.map((approval) => (
                                <div key={approval.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <div className="font-medium">{approval.type} - {approval.name}</div>
                                        <div className="text-sm text-gray-600">{approval.details}</div>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/admin/loans/${approval.id}`)}
                                        className="btn btn-primary px-3 py-1 text-sm"
                                    >
                                        Review
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No pending approvals</p>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
                    {data && data.recentTransactions.length > 0 ? (
                        <div className="space-y-3">
                            {data.recentTransactions.map((txn, index) => (
                                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                    <div>
                                        <div className="font-medium">{txn.description}</div>
                                        <div className="text-sm text-gray-600">{txn.member}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-semibold ${txn.amount >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                                            {txn.amount >= 0 ? '+' : ''}P {Math.abs(txn.amount).toLocaleString()}
                                        </div>
                                        <div className="text-xs text-gray-500">{formatRelativeTime(new Date(txn.date))}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No recent transactions</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
