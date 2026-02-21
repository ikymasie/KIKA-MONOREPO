'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { formatCompactNumber } from '@/lib/dashboard-utils';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [churnData, setChurnData] = useState<any>(null);
    const [reengageStates, setReengageStates] = useState<Record<string, 'idle' | 'loading' | 'done' | 'error'>>({});

    useEffect(() => {
        const fetchBaseData = fetch('/api/admin/analytics').then(res => res.json());
        const fetchChurnData = fetch('/api/admin/analytics/churn').then(res => res.json());

        Promise.all([fetchBaseData, fetchChurnData])
            .then(([base, churn]) => {
                setData(base);
                setChurnData(churn);
            })
            .finally(() => setLoading(false));
    }, []);

    async function handleReengage(memberId: string, memberName: string) {
        setReengageStates(prev => ({ ...prev, [memberId]: 'loading' }));
        try {
            const res = await fetch('/api/admin/communications/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    memberIds: [memberId],
                    type: 'SMS',
                    subject: 'We miss you!',
                    content: `Dear ${memberName}, we noticed you haven\'t been active recently. Your SACCOS account is waiting for you — log in today to check your savings and benefits.`,
                }),
            });
            if (!res.ok) throw new Error('Failed to send');
            setReengageStates(prev => ({ ...prev, [memberId]: 'done' }));
        } catch {
            setReengageStates(prev => ({ ...prev, [memberId]: 'error' }));
            setTimeout(() => setReengageStates(prev => ({ ...prev, [memberId]: 'idle' })), 3000);
        }
    }

    if (loading) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8 animate-pulse space-y-8">
                    <div className="h-8 bg-gray-200 w-64 rounded"></div>
                    <div className="grid grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
                    <p className="text-gray-500">Strategic insight into growth and performance.</p>
                </div>

                {/* Key Performance Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="card p-6 border-l-4 border-l-primary-500 bg-gradient-to-br from-white to-primary-50/30">
                        <div className="text-sm font-medium text-gray-500 mb-1">Total Loan Portfolio</div>
                        <div className="text-2xl font-bold text-gray-900">P {formatCompactNumber(data?.summary.totalPortfolio || 0)}</div>
                    </div>
                    <div className="card p-6 border-l-4 border-l-success-500 bg-gradient-to-br from-white to-success-50/30">
                        <div className="text-sm font-medium text-gray-500 mb-1">Active Loans</div>
                        <div className="text-2xl font-bold text-gray-900">{data?.summary.activeLoansCount} Applications</div>
                    </div>
                    <div className="card p-6 border-l-4 border-l-indigo-500 bg-gradient-to-br from-white to-indigo-50/30">
                        <div className="text-sm font-medium text-gray-500 mb-1">Member Growth</div>
                        <div className="text-2xl font-bold text-gray-900">+{data?.memberGrowth.length > 0 ? data.memberGrowth[data.memberGrowth.length - 1].count : 0} this month</div>
                    </div>
                    <div className="card p-6 border-l-4 border-l-orange-500 bg-gradient-to-br from-white to-orange-50/30">
                        <div className="text-sm font-medium text-gray-500 mb-1">Risk Profile</div>
                        <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            Low
                            <span className="flex h-2 w-2 rounded-full bg-success-500 animate-pulse"></span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Charts placeholders - since D3/Chart.js might not be setup or needs specific config, we use stylized CSS bars */}
                    <div className="card p-8">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span>👥</span> Member Growth Trends
                        </h3>
                        <div className="h-64 flex items-end gap-4">
                            {data?.memberGrowth.map((g: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600 relative"
                                        style={{ height: `${(g.count / Math.max(...data.memberGrowth.map((x: any) => x.count))) * 100}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            {g.count} members
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase rotate-45 mt-4 origin-left">{g.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-8">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span>💰</span> Savings trends (Last 6 Months)
                        </h3>
                        <div className="h-64 flex items-end gap-4">
                            {data?.savingsTrends.map((s: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-indigo-400 rounded-t-lg transition-all hover:bg-indigo-500 relative"
                                        style={{ height: `${(s.total / Math.max(...data.savingsTrends.map((x: any) => x.total))) * 100}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            P {formatCompactNumber(s.total)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase rotate-45 mt-4 origin-left">{s.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Churn Analytics Section */}
                <div className="mt-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-100 rounded-lg text-xl">⚠️</div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Member Churn Analytics</h2>
                            <p className="text-gray-500">Predictive insights into members at risk of leaving.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="card p-8 lg:col-span-1 bg-gradient-to-br from-white to-orange-50/20">
                            <h3 className="font-bold text-gray-900 mb-4">Risk Summary</h3>
                            <div className="space-y-6">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Risk Percentage</div>
                                    <div className="text-4xl font-black text-orange-600">
                                        {churnData?.summary.riskPercentage.toFixed(1)}%
                                    </div>
                                    <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 transition-all duration-1000"
                                            style={{ width: `${churnData?.summary.riskPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white rounded-xl border border-orange-100">
                                        <div className="text-[10px] uppercase font-bold text-gray-400">High Risk</div>
                                        <div className="text-xl font-bold text-gray-900">{churnData?.summary.highRiskCount}</div>
                                    </div>
                                    <div className="p-4 bg-white rounded-xl border border-orange-100">
                                        <div className="text-[10px] uppercase font-bold text-gray-400">Total Active</div>
                                        <div className="text-xl font-bold text-gray-900">{churnData?.summary.totalActive}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-6">
                            <div className="card p-0 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800">Inactive Members (&gt;90 Days)</h4>
                                    <span className="badge badge-warning">{churnData?.inactiveMembers.length} Flagged</span>
                                </div>
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
                                        <tr>
                                            <th className="px-6 py-3">Member</th>
                                            <th className="px-6 py-3">Last Active</th>
                                            <th className="px-6 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {churnData?.inactiveMembers.map((m: any) => (
                                            <tr key={m.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{m.fullName}</div>
                                                    <div className="text-[11px] text-gray-400">{m.email || m.phone}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                                                    {m.lastActive ? new Date(m.lastActive).toLocaleDateString() : 'Never'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {reengageStates[m.id] === 'done' ? (
                                                        <span className="text-success-600 font-bold text-xs">✓ Sent!</span>
                                                    ) : reengageStates[m.id] === 'error' ? (
                                                        <span className="text-danger-600 font-bold text-xs">✗ Failed</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleReengage(m.id, m.fullName)}
                                                            disabled={reengageStates[m.id] === 'loading'}
                                                            className="text-primary-600 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                                        >
                                                            {reengageStates[m.id] === 'loading' ? 'Sending…' : 'Re-engage'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
