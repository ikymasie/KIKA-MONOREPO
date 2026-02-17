'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Link from 'next/link';

interface DeductionRequest {
    id: string;
    batchNumber: string;
    month: number;
    year: number;
    totalMembers: number;
    totalAmount: number;
    status: string;
    csvFileUrl?: string;
    submittedAt?: string;
    createdAt: string;
}

export default function AdminDeductionsBatchesPage() {
    const [batches, setBatches] = useState<DeductionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchBatches();
    }, []);

    async function fetchBatches() {
        try {
            const response = await fetch('/api/admin/deductions/generate');
            if (!response.ok) throw new Error('Failed to fetch batches');
            const data = await response.json();
            setBatches(data.requests || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateBatch() {
        if (!confirm('Generate deduction batch for current month?')) return;

        setGenerating(true);
        setError(null);

        try {
            const now = new Date();
            const response = await fetch('/api/admin/deductions/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month: now.getMonth() + 1,
                    year: now.getFullYear(),
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate batch');
            }

            await fetchBatches();
            alert('Deduction batch generated successfully!');
        } catch (err: any) {
            setError(err.message);
            alert(`Error: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-100 text-gray-700';
            case 'submitted':
                return 'bg-blue-100 text-blue-700';
            case 'processing':
                return 'bg-yellow-100 text-yellow-700';
            case 'completed':
                return 'bg-green-100 text-green-700';
            case 'failed':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Deduction Batches</h1>
                        <p className="text-gray-600">Manage monthly salary deduction requests</p>
                    </div>
                    <div className="flex gap-4">
                        <Link
                            href="/admin/deductions/reconciliations"
                            className="btn btn-secondary px-6 py-2 rounded-lg font-bold"
                        >
                            📊 Reconciliations
                        </Link>
                        <Link
                            href="/admin/deductions/suspense"
                            className="btn btn-secondary px-6 py-2 rounded-lg font-bold"
                        >
                            🔍 Suspense Accounts
                        </Link>
                        <button
                            onClick={handleGenerateBatch}
                            disabled={generating || loading}
                            className={`btn btn-primary px-6 py-2 rounded-lg font-bold flex items-center gap-2 ${generating ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {generating ? '⏳ Generating...' : '➕ Generate New Batch'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="card p-4 bg-red-50 text-red-700 mb-6">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {loading ? (
                    <div className="card p-8 text-center">
                        <div className="animate-pulse">Loading batches...</div>
                    </div>
                ) : batches.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Batches Yet</h3>
                        <p className="text-gray-600 mb-6">Generate your first deduction batch to get started</p>
                        <button
                            onClick={handleGenerateBatch}
                            className="btn btn-primary px-8 py-3 rounded-lg font-bold"
                        >
                            Generate First Batch
                        </button>
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Batch Number
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Period
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
                                        Members
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
                                        Total Amount
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Created
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {batches.map((batch) => (
                                    <tr key={batch.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-mono text-xs">{batch.batchNumber}</td>
                                        <td className="px-6 py-4 font-bold">
                                            {batch.year}-{String(batch.month).padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-4 text-right">{batch.totalMembers}</td>
                                        <td className="px-6 py-4 text-right font-bold text-primary-700">
                                            P {batch.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(
                                                    batch.status
                                                )}`}
                                            >
                                                {batch.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(batch.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Link
                                                    href={`/admin/deductions/batches/${batch.id}`}
                                                    className="text-primary-600 hover:text-primary-700 font-bold text-sm"
                                                >
                                                    View
                                                </Link>
                                                {batch.csvFileUrl && (
                                                    <a
                                                        href={batch.csvFileUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-700 font-bold text-sm"
                                                    >
                                                        Download CSV
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
