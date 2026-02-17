'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface DashboardMetrics {
    totalSaccos: number;
    totalMembers: number;
    totalSavings: number;
    outstandingLoans: number;
    portfolioAtRisk: number;
}

interface RecentActivity {
    type: string;
    description: string;
    date: string;
    status: string;
    amount: number;
}

interface Alert {
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    createdAt: string;
    tenant: {
        id: string;
        name: string;
    };
}

export default function RegulatorDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                const [dashboardRes, alertsRes] = await Promise.all([
                    fetch('/api/regulator/dashboard'),
                    fetch('/api/regulator/alerts?resolved=false')
                ]);

                if (!dashboardRes.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const data = await dashboardRes.json();
                setMetrics(data.metrics);
                setRecentActivity(data.recentActivity);

                if (alertsRes.ok) {
                    const alertsData = await alertsRes.json();
                    setAlerts(alertsData.slice(0, 5)); // Show top 5 alerts
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDashboardData();
    }, []);

    const formatCurrency = (amount: number) => {
        if (amount >= 1_000_000) {
            return `P ${(amount / 1_000_000).toFixed(1)}M`;
        } else if (amount >= 1_000) {
            return `P ${(amount / 1_000).toFixed(1)}K`;
        }
        return `P ${amount.toFixed(2)}`;
    };

    const formatNumber = (num: number) => {
        return num.toLocaleString();
    };

    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('pending') || statusLower.includes('submitted')) {
            return 'bg-warning-100 text-warning-700';
        } else if (statusLower.includes('completed') || statusLower.includes('approved') || statusLower.includes('active')) {
            return 'bg-success-100 text-success-700';
        } else if (statusLower.includes('rejected') || statusLower.includes('suspended')) {
            return 'bg-danger-100 text-danger-700';
        }
        return 'bg-primary-100 text-primary-700';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<RegulatorSidebar />}>
                <div className="p-8 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading dashboard data...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout sidebar={<RegulatorSidebar />}>
                <div className="p-8">
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                        <p className="text-danger-700">Error loading dashboard: {error}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                {/* National Oversight Stats */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">National Oversight</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="card p-6">
                            <div className="text-sm font-medium text-gray-600 mb-2">Total SACCOS</div>
                            <div className="text-3xl font-bold text-primary-700">
                                {metrics ? formatNumber(metrics.totalSaccos) : '0'}
                            </div>
                            <div className="text-xs text-gray-600 mt-2">Active societies</div>
                        </div>
                        <div className="card p-6">
                            <div className="text-sm font-medium text-gray-600 mb-2">Total Members</div>
                            <div className="text-3xl font-bold text-primary-700">
                                {metrics ? formatNumber(metrics.totalMembers) : '0'}
                            </div>
                            <div className="text-xs text-gray-600 mt-2">Across all SACCOS</div>
                        </div>
                        <div className="card p-6">
                            <div className="text-sm font-medium text-gray-600 mb-2">Total Savings</div>
                            <div className="text-3xl font-bold text-primary-700">
                                {metrics ? formatCurrency(metrics.totalSavings) : 'P 0'}
                            </div>
                            <div className="text-xs text-gray-600 mt-2">Across all societies</div>
                        </div>
                        <div className="card p-6">
                            <div className="text-sm font-medium text-gray-600 mb-2">Outstanding Loans</div>
                            <div className="text-3xl font-bold text-primary-700">
                                {metrics ? formatCurrency(metrics.outstandingLoans) : 'P 0'}
                            </div>
                            <div className="text-xs text-warning-600 mt-2">
                                PAR: {metrics ? metrics.portfolioAtRisk : '0'}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/regulator/applications" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <h3 className="font-semibold text-lg mb-2">Deduction Management</h3>
                            <p className="text-sm text-gray-600 mb-4">Review and approve monthly deduction files</p>
                            <button className="btn btn-primary px-4 py-2">Manage Deductions</button>
                        </Link>
                        <Link href="/regulator/reporting" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <h3 className="font-semibold text-lg mb-2">Compliance Monitoring</h3>
                            <p className="text-sm text-gray-600 mb-4">Track regulatory compliance across societies</p>
                            <button className="btn btn-primary px-4 py-2">View Reports</button>
                        </Link>
                        <Link href="/regulator/reporting" className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                            <h3 className="font-semibold text-lg mb-2">Sector Analytics</h3>
                            <p className="text-sm text-gray-600 mb-4">Financial health heatmap and trends</p>
                            <button className="btn btn-primary px-4 py-2">View Analytics</button>
                        </Link>
                    </div>
                </div>

                {/* Regulatory Alerts */}
                {alerts.length > 0 && (
                    <div className="card p-6 mb-8 border-l-4 border-warning-500">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">⚠️ Regulatory Alerts</h2>
                            <span className="text-sm text-gray-600">{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-3">
                            {alerts.map((alert) => {
                                const getSeverityColor = (severity: string) => {
                                    switch (severity) {
                                        case 'critical': return 'bg-danger-100 text-danger-800 border-danger-300';
                                        case 'high': return 'bg-warning-100 text-warning-800 border-warning-300';
                                        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                                        default: return 'bg-gray-100 text-gray-800 border-gray-300';
                                    }
                                };

                                return (
                                    <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold uppercase text-xs">{alert.severity}</span>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="font-medium">{alert.title}</span>
                                                </div>
                                                <p className="text-sm mb-1">{alert.description}</p>
                                                <p className="text-xs text-gray-600">SACCO: {alert.tenant.name}</p>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                                {new Date(alert.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Recent Activity */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                    {recentActivity.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">No recent activity</p>
                    ) : (
                        <div className="space-y-4">
                            {recentActivity.map((activity, index) => (
                                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                                    <div>
                                        <div className="font-medium">{activity.description}</div>
                                        <div className="text-sm text-gray-600">
                                            {formatDate(activity.date)}
                                            {activity.amount > 0 && ` • ${formatCurrency(activity.amount)}`}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(activity.status)}`}>
                                        {activity.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
