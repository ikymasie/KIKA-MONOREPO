'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCompactNumber, formatRelativeTime } from '@/lib/dashboard-utils';

interface Metrics {
    approvalRate: number;
    portfolioAtRiskPercentage: number;
    pendingTasks: number;
    totalDisbursed: number;
    recommendationsCount: number;
    activePortfolioCount: number;
    totalPortfolioOutstanding: number;
}

interface Task {
    id: string;
    loanNumber: string;
    memberName: string;
    productName: string;
    amount: number;
    status: string;
    stage: string;
    applicationDate: string;
    daysPending: number;
    isAssignedToMe: boolean;
    priority: 'high' | 'medium' | 'low';
}

interface PortfolioLoan {
    id: string;
    loanNumber: string;
    member: {
        fullName: string;
        memberNumber: string;
    };
    product: {
        name: string;
    };
    principalAmount: number;
    outstandingBalance: number;
    status: string;
    lastUpdated: string;
}

export default function LoanOfficerDashboardContent() {
    const router = useRouter();
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [portfolio, setPortfolio] = useState<PortfolioLoan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [metricsRes, tasksRes, portfolioRes] = await Promise.all([
                    fetch('/api/admin/loan-officer/metrics'),
                    fetch('/api/admin/loan-officer/tasks'),
                    fetch('/api/admin/loan-officer/portfolio?limit=5')
                ]);

                if (!metricsRes.ok || !tasksRes.ok || !portfolioRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const metricsData = await metricsRes.json();
                const tasksData = await tasksRes.json();
                const portfolioData = await portfolioRes.json();

                setMetrics(metricsData.data);
                setTasks(tasksData.data);
                setPortfolio(portfolioData.data.loans);
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
            <div className="space-y-8 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="card p-6 h-32 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card p-6 h-96 bg-gray-100 rounded-xl"></div>
                    <div className="card p-6 h-96 bg-gray-100 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-danger-50 border border-danger-200 rounded-xl text-danger-700">
                <p className="font-bold">Error loading dashboard</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Loan Officer Workspace</h1>
                    <p className="text-gray-600">Performance and Task Management</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/admin/loans')}
                        className="btn btn-primary"
                    >
                        View All Loans
                    </button>
                </div>
            </header>

            {/* Performance Metrics */}
            {metrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <span className="text-4xl">🎯</span>
                        </div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Approval Rate</div>
                        <div className="text-3xl font-bold text-primary-600">{metrics.approvalRate}%</div>
                        <div className="text-xs text-gray-500 mt-2">Based on your recommendations</div>
                    </div>

                    <div className="card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Portfolio At Risk</div>
                        <div className={`text-3xl font-bold ${metrics.portfolioAtRiskPercentage > 5 ? 'text-danger-600' : 'text-success-600'}`}>
                            {metrics.portfolioAtRiskPercentage}%
                        </div>
                        <div className="text-xs text-gray-500 mt-2">PAR &gt; 30 Days</div>
                    </div>

                    <div className="card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <span className="text-4xl">📝</span>
                        </div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Active Portfolio</div>
                        <div className="text-3xl font-bold text-primary-600">{metrics.activePortfolioCount}</div>
                        <div className="text-xs text-gray-500 mt-2">Loans managed by you</div>
                    </div>

                    <div className="card p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                            <span className="text-4xl">💰</span>
                        </div>
                        <div className="text-sm font-medium text-gray-500 mb-1">Total Disbursed</div>
                        <div className="text-3xl font-bold text-primary-600">{formatCompactNumber(metrics.totalDisbursed)}</div>
                        <div className="text-xs text-gray-500 mt-2">Total loan value</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Task Queue */}
                <section className="card p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">My Task Queue</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                            {tasks.length} Pending
                        </span>
                    </div>

                    <div className="space-y-4 flex-1">
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900 truncate">{task.memberName}</span>
                                            {task.priority === 'high' && (
                                                <span className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-danger-100 text-danger-700">Urgent</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2">
                                            <span>{task.productName}</span>
                                            <span>•</span>
                                            <span>P {task.amount.toLocaleString()}</span>
                                            <span>•</span>
                                            <span className={task.daysPending > 3 ? 'text-danger-600 font-medium' : ''}>
                                                {task.daysPending}d pending
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/admin/loans/${task.id}`)}
                                        className="btn btn-sm btn-primary whitespace-nowrap"
                                    >
                                        Process
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <span className="text-4xl mb-2">🎉</span>
                                <p>No pending tasks! You're all caught up.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Personal Portfolio Preview */}
                <section className="card p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Portfolio Preview</h2>
                        <button
                            onClick={() => router.push('/admin/loans')}
                            className="text-primary-600 text-sm font-medium hover:underline"
                        >
                            View All
                        </button>
                    </div>

                    <div className="space-y-4 flex-1">
                        {portfolio.length > 0 ? (
                            portfolio.map((loan) => (
                                <div key={loan.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <div className="font-medium text-gray-900 truncate">{loan.member.fullName}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                            <span>{loan.loanNumber}</span>
                                            <span>•</span>
                                            <span>{loan.product.name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 text-sm">P {loan.outstandingBalance.toLocaleString()}</div>
                                        <div className={`text-[10px] font-bold uppercase ${loan.status === 'active' ? 'text-success-600' :
                                            loan.status === 'defaulted' ? 'text-danger-600' : 'text-warning-600'
                                            }`}>
                                            {loan.status}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <p>No active loans in your portfolio.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
