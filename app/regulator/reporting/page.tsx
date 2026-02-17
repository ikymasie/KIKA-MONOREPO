'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface ComplianceRecord {
    id: string;
    name: string;
    status: string;
    isCompliant: boolean;
    riskRating: 'Low' | 'Medium' | 'High';
}

interface SectorHealth {
    totalAssets: number;
    totalLoanBook: number;
    liquidityRatio: number;
    capitalAdequacy: number;
}

export default function RegulatorReporting() {
    const [compliance, setCompliance] = useState<ComplianceRecord[]>([]);
    const [health, setHealth] = useState<SectorHealth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReports() {
            try {
                const res = await fetch('/api/regulator/reporting');
                if (res.ok) {
                    const data = await res.json();
                    setCompliance(data.compliance);
                    setHealth(data.sectorHealth);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    }, []);

    const formatCurrency = (val: number) => 'P ' + (val / 1000000).toFixed(2) + 'M';

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Regulatory Analysis & Reporting</h1>
                    <button
                        onClick={() => {
                            window.location.href = '/api/regulator/reporting/export';
                        }}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        📥 Export Compliance Report
                    </button>
                </div>

                {/* Financial Health Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <div className="text-sm text-blue-800 font-medium mb-1">Sector Assets</div>
                        <div className="text-2xl font-bold text-blue-900">{health ? formatCurrency(health.totalAssets) : '-'}</div>
                    </div>
                    <div className="card p-6 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100">
                        <div className="text-sm text-purple-800 font-medium mb-1">Loan Book</div>
                        <div className="text-2xl font-bold text-purple-900">{health ? formatCurrency(health.totalLoanBook) : '-'}</div>
                    </div>
                    <div className="card p-6">
                        <div className="text-sm text-gray-500 font-medium mb-1">Liquidity Ratio</div>
                        <div className="text-2xl font-bold text-gray-900">{health?.liquidityRatio}%</div>
                        <div className="text-xs text-success-600 mt-1">Within target (&gt;15%)</div>
                    </div>
                    <div className="card p-6">
                        <div className="text-sm text-gray-500 font-medium mb-1">Capital Adequacy</div>
                        <div className="text-2xl font-bold text-gray-900">{health?.capitalAdequacy}%</div>
                        <div className="text-xs text-warning-600 mt-1">Watch list (&lt;15%)</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Compliance Table */}
                    <div className="lg:col-span-2 card">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold">Entity Compliance Status</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Entity</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Risk Rating</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {compliance.slice(0, 10).map((c) => (
                                        <tr key={c.id}>
                                            <td className="px-6 py-3 font-medium">{c.name}</td>
                                            <td className="px-6 py-3">
                                                {c.isCompliant ? (
                                                    <span className="text-success-600 text-sm flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-success-500"></span> Compliant
                                                    </span>
                                                ) : (
                                                    <span className="text-danger-600 text-sm flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-danger-500"></span> Non-Compliant
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium 
                                                    ${c.riskRating === 'High' ? 'bg-danger-100 text-danger-800' :
                                                        c.riskRating === 'Medium' ? 'bg-warning-100 text-warning-800' :
                                                            'bg-success-100 text-success-800'}`}>
                                                    {c.riskRating}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Alerts / Tasks */}
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4">Regulatory Alerts</h3>
                        <div className="space-y-4">
                            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
                                <strong>High Risk:</strong> 3 SACCOs have fallen below liquidity requirements.
                            </div>
                            <div className="p-3 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-100">
                                <strong>Late Filing:</strong> 12 entities have not submitted Annual Returns for 2025.
                            </div>
                            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100">
                                <strong>System:</strong> Quarterly audit reports generated successfully.
                            </div>
                        </div>
                        <Link href="/regulator/alerts" className="btn btn-outline w-full mt-6 text-center">
                            View All Alerts
                        </Link>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
