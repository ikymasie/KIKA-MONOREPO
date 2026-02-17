'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { format } from 'date-fns';

interface DashboardData {
    member: {
        name: string;
        memberNumber: string;
    };
    accounts: {
        totalSavings: number;
        shareCapital: number;
        activeLoan: {
            amount: number;
            monthlyPayment: number;
            remainingMonths: number;
            nextPaymentDate: string;
            daysUntilPayment: number;
        } | null;
    };
    nextPayment: {
        amount: number;
        dueDate: string;
        breakdown: {
            loanRepayment?: number;
            monthlySavings: number;
            insurancePremium: number;
        };
    };
    recentActivity: Array<{
        type: string;
        amount: number;
        date: string;
        description: string;
    }>;
}

export default function MemberDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboard() {
            try {
                const response = await fetch('/api/member/dashboard');
                if (!response.ok) throw new Error('Failed to fetch dashboard data');
                const result = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboard();
    }, []);

    if (loading) return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 animate-pulse">
                <div className="h-32 bg-gray-100 rounded-xl mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-xl"></div>)}
                </div>
            </div>
        </DashboardLayout>
    );

    if (error || !data) return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8">
                <div className="card p-6 bg-danger-50 text-danger-700">{error || 'Data not available'}</div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-8 mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome back, {data.member.name}!</h1>
                <p className="text-primary-100">Member #{data.member.memberNumber}</p>
            </div>

            <div className="p-8">
                {/* Account Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card p-6 bg-gradient-to-br from-success-50 to-success-100">
                        <div className="text-sm font-medium text-success-700 mb-2">Total Savings</div>
                        <div className="text-3xl font-bold text-success-900">P {data.accounts.totalSavings.toLocaleString()}</div>
                        <div className="text-xs text-success-600 mt-2">Combined balance</div>
                    </div>
                    <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100">
                        <div className="text-sm font-medium text-primary-700 mb-2">Share Capital</div>
                        <div className="text-3xl font-bold text-primary-900">P {data.accounts.shareCapital.toLocaleString()}</div>
                        <div className="text-xs text-primary-600 mt-2">Locked equity</div>
                    </div>
                    <div className="card p-6 bg-gradient-to-br from-warning-50 to-warning-100">
                        <div className="text-sm font-medium text-warning-700 mb-2">Active Loan</div>
                        <div className="text-3xl font-bold text-warning-900">
                            P {data.accounts.activeLoan ? data.accounts.activeLoan.amount.toLocaleString() : '0'}
                        </div>
                        <div className="text-xs text-warning-600 mt-2">
                            {data.accounts.activeLoan
                                ? `P ${data.accounts.activeLoan.monthlyPayment.toLocaleString()}/month • ${data.accounts.activeLoan.remainingMonths} months left`
                                : 'No active loan'}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button onClick={() => router.push('/member/apply-loan')} className="card p-4 hover:shadow-lg transition-shadow text-center">
                            <div className="text-3xl mb-2">💰</div>
                            <div className="font-semibold text-sm">Apply for Loan</div>
                        </button>
                        <button onClick={() => router.push('/member/statements')} className="card p-4 hover:shadow-lg transition-shadow text-center">
                            <div className="text-3xl mb-2">📄</div>
                            <div className="font-semibold text-sm">View Statement</div>
                        </button>
                        <button onClick={() => router.push('/member/marketplace')} className="card p-4 hover:shadow-lg transition-shadow text-center">
                            <div className="text-3xl mb-2">🛒</div>
                            <div className="font-semibold text-sm">Marketplace</div>
                        </button>
                        <button onClick={() => router.push('/member/insurance')} className="card p-4 hover:shadow-lg transition-shadow text-center">
                            <div className="text-3xl mb-2">🛡️</div>
                            <div className="font-semibold text-sm">Insurance</div>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Next Payment */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">Next Payment Due</h2>
                        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold">Estimated Deduction</span>
                                <span className="text-2xl font-bold text-warning-700">P {data.nextPayment.amount.toLocaleString()}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                                Due: {format(new Date(data.nextPayment.dueDate), 'MMMM dd, yyyy')}
                                ({data.accounts.activeLoan?.daysUntilPayment || 'N/A'} days)
                            </div>
                            <div className="mt-3">
                                <div className="text-xs text-gray-600 mb-1">Deducted from salary</div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-warning-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            {data.nextPayment.breakdown.loanRepayment && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Loan Repayment</span>
                                    <span className="font-semibold">P {data.nextPayment.breakdown.loanRepayment.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Monthly Savings</span>
                                <span className="font-semibold">P {data.nextPayment.breakdown.monthlySavings.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Insurance Premium</span>
                                <span className="font-semibold">P {data.nextPayment.breakdown.insurancePremium.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                                <span className="font-semibold">Total Deduction</span>
                                <span className="font-bold text-primary-700">P {data.nextPayment.amount.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                        <div className="space-y-3">
                            {data.recentActivity.length > 0 ? data.recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${activity.amount > 0 ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'
                                            }`}>
                                            {activity.amount > 0 ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <div className="font-medium">{activity.description}</div>
                                            <div className="text-xs text-gray-600">{format(new Date(activity.date), 'MMM dd, yyyy')}</div>
                                        </div>
                                    </div>
                                    <div className={`font-semibold ${activity.amount > 0 ? 'text-success-700' : 'text-primary-700'}`}>
                                        {activity.amount > 0 ? '+' : ''}P {Math.abs(activity.amount).toLocaleString()}
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-500">No recent activity</div>
                            )}
                        </div>
                        <button
                            onClick={() => router.push('/member/statements')}
                            className="w-full mt-4 text-sm font-bold text-primary-600 hover:text-primary-700"
                        >
                            View All Activity →
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
