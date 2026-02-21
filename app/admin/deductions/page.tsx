'use client';

import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface DeductionRow {
    id: string;
    memberNumber: string;
    name: string;
    savings: number;
    loans: number;
    insurance: number;
    total: number;
}

interface Metrics {
    totalMembers: number;
    deductingMembers: number;
    totalDeductions: number;
    savingsTotal: number;
    loansTotal: number;
    insuranceTotal: number;
}

function generatePeriodOptions(): { label: string; value: string }[] {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        options.push({ label, value });
    }
    return options;
}

export default function AdminDeductionsPage() {
    const [deductions, setDeductions] = useState<DeductionRow[]>([]);
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const periodOptions = useMemo(() => generatePeriodOptions(), []);
    const [selectedPeriod, setSelectedPeriod] = useState(periodOptions[0].value);

    useEffect(() => {
        async function fetchDeductions() {
            try {
                setLoading(true);
                const response = await fetch('/api/admin/deductions');
                if (!response.ok) throw new Error('Failed to fetch deduction data');
                const data = await response.json();
                setDeductions(data.deductions);
                setMetrics(data.metrics);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDeductions();
    }, [selectedPeriod]);

    const handleGenerateCSV = () => {
        setIsGenerating(true);
        try {
            // CSV Header
            const headers = ['Member ID', 'Name', 'Savings', 'Loans', 'Insurance', 'Total'];

            // CSV Content
            const rows = deductions.map(d => [
                d.memberNumber,
                d.name,
                d.savings.toFixed(2),
                d.loans.toFixed(2),
                d.insurance.toFixed(2),
                d.total.toFixed(2)
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(r => r.join(','))
            ].join('\n');

            // Download Logic
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().split('T')[0];

            link.setAttribute('href', url);
            link.setAttribute('download', `Deductions_${selectedPeriod}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert('Deduction CSV generated and download started.');
        } catch (err) {
            alert('Failed to generate CSV');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Monthly Deductions</h1>
                        <p className="text-gray-600">Generate and manage monthly salary deduction files</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-gray-500">Period:</span>
                            <select
                                className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer"
                                value={selectedPeriod}
                                onChange={(e) => setSelectedPeriod(e.target.value)}
                            >
                                {periodOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleGenerateCSV}
                            disabled={isGenerating || loading}
                            className={`btn btn-primary px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isGenerating ? 'Generating...' : '📥 Generate Deduction CSV'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>)}
                    </div>
                ) : error ? (
                    <div className="card p-6 bg-danger-50 text-danger-700 mb-8">{error}</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="card p-6">
                                <div className="text-sm font-medium text-gray-500 mb-1">Deducting Members</div>
                                <div className="text-3xl font-bold text-gray-900">{metrics?.deductingMembers}</div>
                            </div>
                            <div className="card p-6">
                                <div className="text-sm font-medium text-gray-500 mb-1">Total Deductions</div>
                                <div className="text-3xl font-bold text-gray-900">P {metrics?.totalDeductions.toLocaleString()}</div>
                            </div>
                            <div className="card p-6">
                                <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="h-3 w-3 rounded-full bg-warning-500 animate-pulse"></span>
                                    <span className="text-lg font-bold text-warning-700 uppercase tracking-wider">Awaiting Generation</span>
                                </div>
                            </div>
                        </div>

                        <div className="card overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="font-bold text-gray-900">Deduction List Preview</h2>
                            </div>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 italic">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Member ID</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Name</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Savings</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Loans</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Insurance</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-sm">
                                    {deductions.map(row => (
                                        <tr key={row.id}>
                                            <td className="px-6 py-4 font-mono text-xs">{row.memberNumber}</td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{row.name}</td>
                                            <td className="px-6 py-4 text-right">P {row.savings.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">P {row.loans.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right">P {row.insurance.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-right font-black text-primary-700">P {row.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold border-t-2 border-primary-100">
                                        <td colSpan={2} className="px-6 py-4 text-gray-900">TOTAL</td>
                                        <td className="px-6 py-4 text-right text-gray-900">P {metrics?.savingsTotal.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">P {metrics?.loansTotal.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-gray-900">P {metrics?.insuranceTotal.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right text-primary-800 text-lg">P {metrics?.totalDeductions.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
