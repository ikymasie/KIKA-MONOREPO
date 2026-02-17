'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';

interface SaccoDetail {
    sacco: {
        id: string;
        name: string;
        registrationNumber: string;
        status: string;
        createdAt: string;
        address?: string;
        contactEmail?: string;
        contactPhone?: string;
    };
    members: {
        total: number;
        byStatus: Array<{ status: string; count: string }>;
    };
    financial: {
        totalSavings: number;
        accountsByType: Array<{ type: string; count: string; total: string }>;
        loans: {
            total: number;
            active: number;
            totalDisbursed: number;
            totalOutstanding: number;
            portfolioAtRisk: number;
        };
    };
    compliance: {
        hasActiveRegistration: boolean;
        liquidityRatio: string;
        capitalAdequacy: string;
        lastAuditDate: string | null;
        isCompliant: boolean;
    };
    recentActivity: Array<{
        id: string;
        type: string;
        amount: number;
        description: string;
        memberName: string;
        createdAt: string;
    }>;
}

export default function SaccoReportPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<SaccoDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchSaccoDetails();
    }, [params.id]);

    async function fetchSaccoDetails() {
        try {
            const res = await fetch(`/api/regulator/saccos/${params.id}`);
            if (!res.ok) {
                throw new Error('Failed to fetch SACCO details');
            }
            const result = await res.json();
            setData(result);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (amount: number) => {
        return `P ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<RegulatorSidebar />}>
                <div className="p-8 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading report...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error || !data) {
        return (
            <DashboardLayout sidebar={<RegulatorSidebar />}>
                <div className="p-8">
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                        <p className="text-danger-700">Error: {error || 'SACCO not found'}</p>
                    </div>
                    <Link href={`/regulator/saccos/${params.id}`} className="btn btn-secondary mt-4">
                        ← Back to SACCO Details
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    const liquidityRatio = parseFloat(data.compliance.liquidityRatio);
    const capitalAdequacy = parseFloat(data.compliance.capitalAdequacy);

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                {/* Header - No Print */}
                <div className="mb-6 print:hidden">
                    <Link href={`/regulator/saccos/${params.id}`} className="text-primary-600 hover:text-primary-800 mb-2 inline-block">
                        ← Back to SACCO Details
                    </Link>
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Comprehensive SACCO Report</h1>
                        <button onClick={handlePrint} className="btn btn-secondary">
                            🖨️ Print Report
                        </button>
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-8">
                    <div className="text-center border-b-2 border-gray-300 pb-4">
                        <h1 className="text-3xl font-bold">Regulatory Authority</h1>
                        <h2 className="text-xl mt-2">Comprehensive SACCO Report</h2>
                        <p className="text-sm text-gray-600 mt-2">Generated: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Report Content */}
                <div className="card p-8 print:shadow-none">
                    {/* SACCO Information */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary-500 pb-2">SACCO Information</h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Basic Details</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm text-gray-500">Name</dt>
                                        <dd className="font-medium">{data.sacco.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Registration Number</dt>
                                        <dd className="font-medium">{data.sacco.registrationNumber}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Status</dt>
                                        <dd className="font-medium capitalize">{data.sacco.status}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Registered Date</dt>
                                        <dd className="font-medium">{new Date(data.sacco.createdAt).toLocaleDateString()}</dd>
                                    </div>
                                </dl>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-sm text-gray-500">Address</dt>
                                        <dd className="font-medium">{data.sacco.address || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Email</dt>
                                        <dd className="font-medium">{data.sacco.contactEmail || 'N/A'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500">Phone</dt>
                                        <dd className="font-medium">{data.sacco.contactPhone || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </section>

                    {/* Membership Statistics */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary-500 pb-2">Membership Statistics</h2>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-sm text-blue-800 font-medium">Total Members</div>
                                <div className="text-3xl font-bold text-blue-900">{data.members.total}</div>
                            </div>
                        </div>
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-semibold">Status</th>
                                    <th className="px-4 py-2 text-right text-sm font-semibold">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.members.byStatus.map((stat, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="px-4 py-2 capitalize">{stat.status}</td>
                                        <td className="px-4 py-2 text-right font-medium">{stat.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Financial Overview */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary-500 pb-2">Financial Overview</h2>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-sm text-green-800 font-medium">Total Savings</div>
                                <div className="text-xl font-bold text-green-900">{formatCurrency(data.financial.totalSavings)}</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-sm text-purple-800 font-medium">Total Loans</div>
                                <div className="text-xl font-bold text-purple-900">{data.financial.loans.total}</div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <div className="text-sm text-indigo-800 font-medium">Loans Disbursed</div>
                                <div className="text-xl font-bold text-indigo-900">{formatCurrency(data.financial.loans.totalDisbursed)}</div>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg">
                                <div className="text-sm text-orange-800 font-medium">Outstanding</div>
                                <div className="text-xl font-bold text-orange-900">{formatCurrency(data.financial.loans.totalOutstanding)}</div>
                            </div>
                        </div>

                        {/* Accounts by Type */}
                        <h3 className="font-semibold text-lg mb-3">Accounts by Type</h3>
                        <table className="w-full mb-6">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-semibold">Account Type</th>
                                    <th className="px-4 py-2 text-right text-sm font-semibold">Count</th>
                                    <th className="px-4 py-2 text-right text-sm font-semibold">Total Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.financial.accountsByType.map((acc, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="px-4 py-2 capitalize">{acc.type}</td>
                                        <td className="px-4 py-2 text-right">{acc.count}</td>
                                        <td className="px-4 py-2 text-right font-medium">{formatCurrency(parseFloat(acc.total))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Portfolio Quality */}
                        <h3 className="font-semibold text-lg mb-3">Portfolio Quality</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700">Portfolio at Risk (PAR)</span>
                                <span className={`text-2xl font-bold ${data.financial.loans.portfolioAtRisk > 5 ? 'text-danger-600' : 'text-success-600'}`}>
                                    {data.financial.loans.portfolioAtRisk.toFixed(2)}%
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                                {data.financial.loans.portfolioAtRisk > 5 ? '⚠️ Above recommended threshold (5%)' : '✓ Within acceptable range'}
                            </div>
                        </div>
                    </section>

                    {/* Compliance & Regulatory Metrics */}
                    <section className="mb-8">
                        <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary-500 pb-2">Compliance & Regulatory Metrics</h2>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3">Liquidity Ratio</h3>
                                <div className="text-3xl font-bold mb-2">{liquidityRatio.toFixed(2)}%</div>
                                <div className="text-sm">
                                    <span className="text-gray-600">Minimum Required: 15%</span>
                                    <div className={`mt-1 ${liquidityRatio >= 15 ? 'text-success-600' : 'text-danger-600'}`}>
                                        {liquidityRatio >= 15 ? '✓ Compliant' : '⚠️ Below Minimum'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3">Capital Adequacy</h3>
                                <div className="text-3xl font-bold mb-2">{capitalAdequacy.toFixed(2)}%</div>
                                <div className="text-sm">
                                    <span className="text-gray-600">Minimum Required: 10%</span>
                                    <div className={`mt-1 ${capitalAdequacy >= 10 ? 'text-success-600' : 'text-danger-600'}`}>
                                        {capitalAdequacy >= 10 ? '✓ Compliant' : '⚠️ Below Minimum'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-4 rounded-lg border-2 ${data.compliance.isCompliant ? 'border-success-500 bg-success-50' : 'border-warning-500 bg-warning-50'}">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{data.compliance.isCompliant ? '✓' : '⚠️'}</span>
                                <div>
                                    <div className="font-bold text-lg">
                                        Overall Compliance Status: {data.compliance.isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        {data.compliance.isCompliant
                                            ? 'SACCO meets all regulatory requirements'
                                            : 'SACCO requires immediate attention to address compliance issues'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Recent Activity */}
                    <section className="mb-8 print:break-before-page">
                        <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary-500 pb-2">Recent Activity (Last 10 Transactions)</h2>
                        {data.recentActivity.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No recent activity</p>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Type</th>
                                        <th className="px-4 py-2 text-left text-sm font-semibold">Member</th>
                                        <th className="px-4 py-2 text-right text-sm font-semibold">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentActivity.map((activity) => (
                                        <tr key={activity.id} className="border-b">
                                            <td className="px-4 py-2 text-sm">{new Date(activity.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 capitalize">{activity.type}</td>
                                            <td className="px-4 py-2">{activity.memberName}</td>
                                            <td className="px-4 py-2 text-right font-medium">{formatCurrency(activity.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                    {/* Report Footer */}
                    <section className="mt-12 pt-6 border-t-2 border-gray-300">
                        <div className="text-sm text-gray-600">
                            <p><strong>Report Generated:</strong> {new Date().toLocaleString()}</p>
                            <p className="mt-2"><strong>Prepared by:</strong> Regulatory Authority</p>
                            <p className="mt-4 text-xs">This report is confidential and intended for regulatory purposes only.</p>
                        </div>
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
