'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface ComplianceScore {
    id: string;
    tenant: {
        id: string;
        name: string;
    };
    overallScore: number;
    kycScore: number;
    reportingScore: number;
    bylawScore: number;
    issueScore: number;
    alertScore: number;
    rating: string;
    calculatedAt: string;
}

export default function ComplianceScoresPage() {
    const [scores, setScores] = useState<ComplianceScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [calculating, setCalculating] = useState(false);

    useEffect(() => {
        fetchScores();
    }, []);

    async function fetchScores() {
        try {
            const response = await fetch('/api/regulator/compliance/scores');
            if (!response.ok) throw new Error('Failed to fetch compliance scores');
            const data = await response.json();
            setScores(data || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function calculateAllScores() {
        if (!confirm('Calculate compliance scores for all SACCOs? This may take a moment.')) {
            return;
        }

        setCalculating(true);
        try {
            const tenantIds = scores.map(s => s.tenant.id);
            const response = await fetch('/api/regulator/compliance/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantIds }),
            });

            if (!response.ok) throw new Error('Failed to calculate scores');

            alert('Compliance scores calculated successfully');
            await fetchScores();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setCalculating(false);
        }
    }

    const getRatingColor = (rating: string) => {
        switch (rating.toLowerCase()) {
            case 'excellent':
                return 'bg-success-100 text-success-800';
            case 'good':
                return 'bg-primary-100 text-primary-800';
            case 'fair':
                return 'bg-warning-100 text-warning-800';
            case 'poor':
                return 'bg-orange-100 text-orange-800';
            case 'critical':
                return 'bg-danger-100 text-danger-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'text-success-700';
        if (score >= 75) return 'text-primary-700';
        if (score >= 60) return 'text-warning-700';
        if (score >= 40) return 'text-orange-700';
        return 'text-danger-700';
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<RegulatorSidebar />}>
                <div className="p-8 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading compliance scores...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Compliance Scores</h1>
                        <p className="text-gray-600 mt-2">
                            View and manage compliance ratings for all SACCOs
                        </p>
                    </div>
                    <button
                        onClick={calculateAllScores}
                        disabled={calculating}
                        className="btn btn-primary px-6 py-3"
                    >
                        {calculating ? 'Calculating...' : '🔄 Recalculate All Scores'}
                    </button>
                </div>

                {error && (
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
                        <p className="text-danger-700">Error: {error}</p>
                    </div>
                )}

                {/* Scoring Methodology */}
                <div className="card p-6 mb-6 bg-primary-50 border-primary-200">
                    <h3 className="font-semibold text-lg mb-3">Scoring Methodology</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                        <div>
                            <div className="font-medium text-gray-900">KYC Compliance</div>
                            <div className="text-gray-600">25% weight</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Reporting Timeliness</div>
                            <div className="text-gray-600">25% weight</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Bye-laws Adherence</div>
                            <div className="text-gray-600">20% weight</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Open Issues</div>
                            <div className="text-gray-600">20% weight</div>
                        </div>
                        <div>
                            <div className="font-medium text-gray-900">Alert Resolution</div>
                            <div className="text-gray-600">10% weight</div>
                        </div>
                    </div>
                </div>

                {/* Scores Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        SACCO
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Overall Score
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rating
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        KYC
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Reporting
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Bye-laws
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Issues
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Alerts
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {scores.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                            No compliance scores available. Click "Recalculate All Scores" to generate.
                                        </td>
                                    </tr>
                                ) : (
                                    scores.map((score) => (
                                        <tr key={score.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link
                                                    href={`/regulator/saccos/${score.tenant.id}`}
                                                    className="font-medium text-primary-600 hover:text-primary-700"
                                                >
                                                    {score.tenant.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`text-2xl font-bold ${getScoreColor(score.overallScore)}`}>
                                                    {score.overallScore.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRatingColor(score.rating)}`}>
                                                    {score.rating.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {score.kycScore.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {score.reportingScore.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {score.bylawScore.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {score.issueScore.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {score.alertScore.toFixed(1)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-xs text-gray-500">
                                                {new Date(score.calculatedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
