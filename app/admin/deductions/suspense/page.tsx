'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Link from 'next/link';

interface SuspenseEntry {
    id: string;
    referenceNumber: string;
    memberNumber?: string;
    nationalId?: string;
    employeeNumber?: string;
    amount: number;
    month: number;
    year: number;
    status: string;
    reason?: string;
    daysInSuspense: number;
    createdAt: string;
    allocatedToMember?: {
        id: string;
        fullName: string;
        memberNumber: string;
    };
}

export default function SuspenseAccountsPage() {
    const [entries, setEntries] = useState<SuspenseEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        fetchEntries();
    }, [filter]);

    async function fetchEntries() {
        try {
            const url = filter === 'all' ? '/api/admin/suspense' : `/api/admin/suspense?status=${filter}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch suspense entries');
            const data = await response.json();
            setEntries(data.entries || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-700';
            case 'allocated':
                return 'bg-green-100 text-green-700';
            case 'refunded':
                return 'bg-blue-100 text-blue-700';
            case 'written_off':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getAgeColor = (days: number) => {
        if (days < 30) return 'text-green-600';
        if (days < 90) return 'text-yellow-600';
        return 'text-red-600';
    };

    const totalPending = entries
        .filter((e) => e.status === 'pending')
        .reduce((sum, e) => sum + e.amount, 0);

    const totalAllocated = entries
        .filter((e) => e.status === 'allocated')
        .reduce((sum, e) => sum + e.amount, 0);

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Suspense Accounts</h1>
                        <p className="text-gray-600">Manage orphan deductions and unmatched payments</p>
                    </div>
                    <Link
                        href="/admin/deductions/batches"
                        className="btn btn-secondary px-6 py-2 rounded-lg font-bold"
                    >
                        ← Back to Batches
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card p-6">
                        <div className="text-sm font-medium text-gray-500 mb-1">Pending Allocation</div>
                        <div className="text-3xl font-bold text-yellow-700">P {totalPending.toLocaleString()}</div>
                        <div className="text-sm text-gray-600 mt-1">
                            {entries.filter((e) => e.status === 'pending').length} entries
                        </div>
                    </div>
                    <div className="card p-6">
                        <div className="text-sm font-medium text-gray-500 mb-1">Allocated</div>
                        <div className="text-3xl font-bold text-green-700">P {totalAllocated.toLocaleString()}</div>
                        <div className="text-sm text-gray-600 mt-1">
                            {entries.filter((e) => e.status === 'allocated').length} entries
                        </div>
                    </div>
                    <div className="card p-6">
                        <div className="text-sm font-medium text-gray-500 mb-1">Total Entries</div>
                        <div className="text-3xl font-bold text-gray-900">{entries.length}</div>
                        <div className="text-sm text-gray-600 mt-1">All time</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex gap-2">
                    {['all', 'pending', 'allocated', 'refunded', 'written_off'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm ${filter === status
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {status.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="card p-8 text-center">
                        <div className="animate-pulse">Loading suspense entries...</div>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Suspense Entries</h3>
                        <p className="text-gray-600">All deductions have been matched successfully</p>
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Reference
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Member Info
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Period
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
                                        Amount
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Age
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                        Allocated To
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-mono text-xs">{entry.referenceNumber}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                {entry.memberNumber && (
                                                    <div className="font-bold">{entry.memberNumber}</div>
                                                )}
                                                {entry.nationalId && (
                                                    <div className="text-gray-600 text-xs">{entry.nationalId}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.year}-{String(entry.month).padStart(2, '0')}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-primary-700">
                                            P {entry.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${getAgeColor(entry.daysInSuspense)}`}>
                                                {entry.daysInSuspense} days
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(
                                                    entry.status
                                                )}`}
                                            >
                                                {entry.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {entry.allocatedToMember ? (
                                                <div className="text-sm">
                                                    <div className="font-bold">{entry.allocatedToMember.fullName}</div>
                                                    <div className="text-gray-600 text-xs">
                                                        {entry.allocatedToMember.memberNumber}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
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
