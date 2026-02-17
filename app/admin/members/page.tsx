'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface Member {
    id: string;
    memberNumber: string;
    firstName: string;
    lastName: string;
    idNumber: string;
    phoneNumber: string;
    email: string;
    status: string;
    joinDate: string;
    employerName: string;
}

interface MembersData {
    members: Member[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export default function MembersPage() {
    const router = useRouter();
    const [data, setData] = useState<MembersData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<string>('');
    const [page, setPage] = useState(1);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [pendingBulkStatus, setPendingBulkStatus] = useState<string>('');

    useEffect(() => {
        fetchMembers();
    }, [page, status]);

    async function fetchMembers() {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });

            if (status) params.append('status', status);
            if (search) params.append('search', search);

            const response = await fetch(`/api/admin/members?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch members');
            }
            const result = await response.json();
            setData(result.data);
            setSelectedIds([]); // Clear selection on refresh
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setPage(1);
        fetchMembers();
    }

    async function handleExport(all: boolean = true) {
        try {
            const params = new URLSearchParams();
            if (!all && selectedIds.length > 0) {
                // For selected, we might want a different logic or just use IDs
                // But the implementation plan says support same filters as members list
                // If we want to export only selected, we might need a POST or a long query param
                // Let's stick to "Export All" for now as per simple implementation
            }

            if (status) params.append('status', status);
            if (search) params.append('search', search);

            window.location.href = `/api/admin/members/export?${params.toString()}`;
        } catch (err) {
            alert('Export failed');
        }
    }

    async function handleBulkStatusUpdate(newStatus: string) {
        if (!newStatus) return;

        if (newStatus === 'deceased') {
            setPendingBulkStatus(newStatus);
            setShowStatusModal(true);
            return;
        }

        performBulkStatusUpdate(newStatus);
    }

    async function performBulkStatusUpdate(newStatus: string) {
        try {
            setActionLoading(true);
            const response = await fetch('/api/admin/members/bulk-update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds, status: newStatus }),
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || 'Failed to update members');
            }

            alert('Members updated successfully');
            setShowStatusModal(false);
            fetchMembers();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    }

    function toggleSelectAll() {
        if (selectedIds.length === data?.members.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(data?.members.map(m => m.id) || []);
        }
    }

    function toggleSelectItem(id: string) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    function getStatusBadgeColor(status: string) {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-success-100 text-success-700';
            case 'inactive':
                return 'bg-gray-100 text-gray-700';
            case 'suspended':
                return 'bg-warning-100 text-warning-700';
            case 'deceased':
                return 'bg-danger-100 text-danger-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Members</h1>
                        <p className="text-gray-600 mt-1">Manage SACCOS members</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => handleExport()} className="btn btn-secondary flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export CSV
                        </button>
                        <Link href="/admin/members/new" className="btn btn-primary flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Member
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-6 mb-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search by name, member number, or ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="DECEASED">Deceased</option>
                        </select>
                        <button type="submit" className="btn btn-primary">
                            Search
                        </button>
                    </form>
                </div>

                {/* Bulk Action Toolbar */}
                {selectedIds.length > 0 && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 text-white px-6 py-4 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-8">
                        <span className="font-bold border-r border-gray-700 pr-6">{selectedIds.length} Members Selected</span>
                        <div className="flex items-center gap-4">
                            <select
                                onChange={(e) => handleBulkStatusUpdate(e.target.value)}
                                className="bg-gray-800 text-sm border-none rounded-lg focus:ring-0 cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled>Update Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="suspended">Suspended</option>
                                <option value="deceased">Deceased</option>
                            </select>
                            <button onClick={() => setSelectedIds([])} className="text-sm text-gray-400 hover:text-white transition-colors">
                                Clear Selection
                            </button>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                        <p className="text-danger-700">Error: {error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="card p-6">
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Members Table */}
                {!loading && data && (
                    <>
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                    checked={selectedIds.length === data.members.length && data.members.length > 0}
                                                    onChange={toggleSelectAll}
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Member #
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ID Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Join Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.members.length > 0 ? (
                                            data.members.map((member) => (
                                                <tr key={member.id} className={`hover:bg-gray-50 ${selectedIds.includes(member.id) ? 'bg-primary-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                                            checked={selectedIds.includes(member.id)}
                                                            onChange={() => toggleSelectItem(member.id)}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {member.memberNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {member.firstName} {member.lastName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{member.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {member.idNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {member.phoneNumber}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(member.status)}`}>
                                                            {member.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {new Date(member.joinDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button
                                                            onClick={() => router.push(`/admin/members/${member.id}`)}
                                                            className="text-primary-600 hover:text-primary-900"
                                                        >
                                                            View
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                    No members found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {data.pagination.totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{(page - 1) * data.pagination.limit + 1}</span> to{' '}
                                    <span className="font-medium">
                                        {Math.min(page * data.pagination.limit, data.pagination.total)}
                                    </span>{' '}
                                    of <span className="font-medium">{data.pagination.total}</span> members
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === data.pagination.totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Bulk Deceased Warning Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-4 text-center">Critical Warning!</h3>
                        <p className="text-gray-600 mb-6 text-center">
                            You are about to mark <span className="font-bold text-danger-700">{selectedIds.length} members</span> as <span className="font-bold text-danger-700 uppercase">Deceased</span>.
                            <br /><br />
                            This action <span className="font-bold">cannot be easily undone</span> and will restrict these accounts significantly.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                className="flex-1 btn btn-secondary"
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => performBulkStatusUpdate(pendingBulkStatus)}
                                className="flex-1 btn bg-danger-600 hover:bg-danger-700 text-white"
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Updating...' : 'I Understand, Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
