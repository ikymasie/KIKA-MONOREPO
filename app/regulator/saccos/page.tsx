'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';

interface DirectoryItem {
    id: string;
    name: string;
    registrationNumber: string;
    status: string;
    memberCount: number;
    totalAssets: number;
    joinedDate: string;
}

export default function RegulatorDirectory() {
    const [entities, setEntities] = useState<DirectoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchDirectory();
    }, [search, statusFilter]);

    async function fetchDirectory() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('q', search);
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`/api/regulator/directory?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setEntities(data);
            }
        } catch (error) {
            console.error('Failed to fetch directory', error);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (val: number) => 'P ' + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Status badges
    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'active') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">Active</span>;
        if (s === 'suspended') return <span className="px-2 py-1 rounded-full text-xs font-medium bg-danger-100 text-danger-800">Suspended</span>;
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">SACCO Directory</h1>
                    <button
                        onClick={() => {
                            const params = new URLSearchParams();
                            if (search) params.append('search', search);
                            if (statusFilter) params.append('status', statusFilter);
                            window.location.href = `/api/regulator/directory/export?${params.toString()}`;
                        }}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        📥 Export CSV
                    </button>
                </div>
                <p className="text-gray-600 mb-6">Directory of all regulated SACCOs and societies</p>

                {/* Filters */}
                <div className="card p-4 mb-6 flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                        <input
                            type="text"
                            placeholder="Search by name or reg number..."
                            className="input w-full"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-48">
                        <select
                            className="input w-full"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Entity Name</th>
                                    <th className="px-6 py-4">Reg Number</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Members</th>
                                    <th className="px-6 py-4 text-right">Total Assets</th>
                                    <th className="px-6 py-4">Joined</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading directory...</td>
                                    </tr>
                                ) : entities.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No entities found matching criteria.</td>
                                    </tr>
                                ) : (
                                    entities.map((entity) => (
                                        <tr key={entity.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{entity.name}</td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-sm">{entity.registrationNumber}</td>
                                            <td className="px-6 py-4">{getStatusBadge(entity.status)}</td>
                                            <td className="px-6 py-4 text-right text-gray-700">{entity.memberCount}</td>
                                            <td className="px-6 py-4 text-right text-gray-700 font-medium">{formatCurrency(entity.totalAssets)}</td>
                                            <td className="px-6 py-4 text-gray-500 text-sm">{new Date(entity.joinedDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                <Link href={`/regulator/saccos/${entity.id}`} className="text-primary-600 hover:text-primary-800 font-medium text-sm">
                                                    View
                                                </Link>
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
