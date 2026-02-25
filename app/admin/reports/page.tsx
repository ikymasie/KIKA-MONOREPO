'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface PARReport {
    par30: number;
    par60: number;
    par90: number;
    totalPortfolio: number;
    par30Pct: number;
    par60Pct: number;
    par90Pct: number;
}

interface DemandForecasting {
    totalAmount: number;
    count: number;
    categories: {
        pending: number;
        approved: number;
    };
}

interface AssetSummary {
    totalValuation: number;
    count: number;
    collateralReady: number;
}

interface ReportsData {
    parReport: PARReport;
    demandForecasting: DemandForecasting;
    assetSummary: AssetSummary;
}

export default function AdminReportsPage() {
    const [data, setData] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchReports() {
            try {
                const res = await fetch('/api/admin/reports');
                if (!res.ok) {
                    throw new Error('Failed to fetch reports');
                }
                const data = await res.json();
                setData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BW', {
            style: 'currency',
            currency: 'BWP',
        }).format(amount);
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8 animate-pulse space-y-8">
                    <div className="h-8 bg-gray-200 w-64 rounded"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>)}
                    </div>
                    <div className="h-64 bg-gray-100 rounded-2xl"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8 text-center">
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block">
                        <p className="font-bold">Error loading reports</p>
                        <p className="text-sm">{error || 'Unknown error'}</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const { parReport, demandForecasting, assetSummary } = data;

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Administrative Reports</h1>
                    <p className="text-gray-500">Key metrics for SACCOS financial performance and risk monitoring.</p>
                </div>

                {/* Top Level Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card p-6 border-l-4 border-l-primary-500 bg-gradient-to-br from-white to-primary-50/20">
                        <div className="text-sm font-medium text-gray-500 mb-1">Total Loan Portfolio</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(parReport.totalPortfolio)}</div>
                        <div className="text-xs text-primary-600 mt-1">Outstanding Balance</div>
                    </div>
                    <div className="card p-6 border-l-4 border-l-success-500 bg-gradient-to-br from-white to-success-50/20">
                        <div className="text-sm font-medium text-gray-500 mb-1">Asset Valuation</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(assetSummary.totalValuation)}</div>
                        <div className="text-xs text-success-600 mt-1">{assetSummary.count} Registered Assets</div>
                    </div>
                    <div className="card p-6 border-l-4 border-l-indigo-500 bg-gradient-to-br from-white to-indigo-50/20">
                        <div className="text-sm font-medium text-gray-500 mb-1">Capital Demand</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(demandForecasting.totalAmount)}</div>
                        <div className="text-xs text-indigo-600 mt-1">{demandForecasting.count} Pending/Approved Loans</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Portfolio at Risk (PAR) */}
                    <div className="card p-8">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span>🛡️</span> Portfolio at Risk (PAR)
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 font-medium">PAR 30 (30-60 Days)</span>
                                    <span className="font-bold text-warning-600">{parReport.par30Pct.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-warning-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(parReport.par30Pct, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="mt-1 text-right text-[10px] text-gray-400 font-bold uppercase">
                                    {formatCurrency(parReport.par30)}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 font-medium">PAR 60 (60-90 Days)</span>
                                    <span className="font-bold text-orange-600">{parReport.par60Pct.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(parReport.par60Pct, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="mt-1 text-right text-[10px] text-gray-400 font-bold uppercase">
                                    {formatCurrency(parReport.par60)}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 font-medium">PAR 90 (90+ Days)</span>
                                    <span className="font-bold text-danger-600">{parReport.par90Pct.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-danger-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.min(parReport.par90Pct, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="mt-1 text-right text-[10px] text-gray-400 font-bold uppercase">
                                    {formatCurrency(parReport.par90)}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Risk Insight</h4>
                            <p className="text-sm text-gray-600">
                                {parReport.par90Pct > 5
                                    ? "⚠️ High Risk: PAR 90 is above 5%. Immediate collection efforts required for delinquent accounts."
                                    : "✅ Healthy: Portfolio at risk remains within acceptable regulatory limits."
                                }
                            </p>
                        </div>
                    </div>

                    {/* Demand Forecasting */}
                    <div className="card p-8 bg-gradient-to-br from-white to-indigo-50/10">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span>📈</span> Loan Demand Forecast
                        </h3>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Pending Review</div>
                                <div className="text-2xl font-bold text-gray-900">{demandForecasting.categories.pending}</div>
                                <div className="text-xs text-gray-500">Applications</div>
                            </div>
                            <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Approved/Unfunded</div>
                                <div className="text-2xl font-bold text-gray-900">{demandForecasting.categories.approved}</div>
                                <div className="text-xs text-gray-500">Applications</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase">Liquidity Readiness</h4>
                            <div className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-gray-800">Available Collateral</div>
                                    <div className="text-xs text-gray-500">Value of assets tied to active status</div>
                                </div>
                                <div className="text-lg font-bold text-success-600">{formatCurrency(assetSummary.collateralReady)}</div>
                            </div>
                            <div className="p-4 bg-white border border-gray-100 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="text-sm font-bold text-gray-800">Forecasted Disbursement</div>
                                    <div className="text-xs text-gray-500">Required next {demandForecasting.categories.approved + demandForecasting.categories.pending} payouts</div>
                                </div>
                                <div className="text-lg font-bold text-indigo-600">{formatCurrency(demandForecasting.totalAmount)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
