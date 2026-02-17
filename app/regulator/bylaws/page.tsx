'use client';

import { useState, useEffect } from 'react';
import { FileText, Check, X, Download, Filter } from 'lucide-react';

interface Bylaw {
    id: string;
    tenantId: string;
    version: string;
    submittedDate: string;
    status: 'pending' | 'approved' | 'rejected';
    documentUrl?: string;
    tenant: {
        name: string;
    };
    approver?: {
        firstName: string;
        lastName: string;
    };
    approvedDate?: string;
    effectiveDate?: string;
    rejectionReason?: string;
}

export default function BylawsPage() {
    const [bylaws, setBylaws] = useState<Bylaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [selectedBylaw, setSelectedBylaw] = useState<Bylaw | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [effectiveDate, setEffectiveDate] = useState('');
    const [notes, setNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [requiredChanges, setRequiredChanges] = useState('');

    useEffect(() => {
        fetchBylaws();
    }, [activeTab]);

    const fetchBylaws = async () => {
        try {
            setLoading(true);
            const status = activeTab === 'all' ? '' : activeTab;
            const response = await fetch(`/api/regulator/bylaws?status=${status}`);
            const data = await response.json();
            setBylaws(data.bylaws || []);
        } catch (error) {
            console.error('Error fetching bylaws:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedBylaw) return;

        try {
            const response = await fetch(`/api/regulator/bylaws/${selectedBylaw.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ effectiveDate, notes }),
            });

            if (response.ok) {
                setShowApproveModal(false);
                setSelectedBylaw(null);
                setEffectiveDate('');
                setNotes('');
                fetchBylaws();
            }
        } catch (error) {
            console.error('Error approving bylaw:', error);
        }
    };

    const handleReject = async () => {
        if (!selectedBylaw) return;

        try {
            const response = await fetch(`/api/regulator/bylaws/${selectedBylaw.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason, requiredChanges }),
            });

            if (response.ok) {
                setShowRejectModal(false);
                setSelectedBylaw(null);
                setRejectionReason('');
                setRequiredChanges('');
                fetchBylaws();
            }
        } catch (error) {
            console.error('Error rejecting bylaw:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Bye-laws Management</h1>
                <p className="text-gray-600 mt-2">Review and approve SACCOS bye-laws submissions</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === tab
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Bylaws Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SACCOS
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Version
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Submitted Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    Loading...
                                </td>
                            </tr>
                        ) : bylaws.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    No bye-laws found
                                </td>
                            </tr>
                        ) : (
                            bylaws.map((bylaw) => (
                                <tr key={bylaw.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {bylaw.tenant.name}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{bylaw.version}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(bylaw.submittedDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(bylaw.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        {bylaw.documentUrl && (
                                            <a
                                                href={bylaw.documentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                <Download className="inline w-4 h-4" />
                                            </a>
                                        )}
                                        {bylaw.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBylaw(bylaw);
                                                        setShowApproveModal(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    <Check className="inline w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedBylaw(bylaw);
                                                        setShowRejectModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <X className="inline w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Approve Modal */}
            {showApproveModal && selectedBylaw && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Approve Bye-laws</h3>
                        <p className="text-gray-600 mb-4">
                            Approve bye-laws for {selectedBylaw.tenant.name} (Version {selectedBylaw.version})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Effective Date
                                </label>
                                <input
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setSelectedBylaw(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedBylaw && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Reject Bye-laws</h3>
                        <p className="text-gray-600 mb-4">
                            Reject bye-laws for {selectedBylaw.tenant.name} (Version {selectedBylaw.version})
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rejection Reason *
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Required Changes
                                </label>
                                <textarea
                                    value={requiredChanges}
                                    onChange={(e) => setRequiredChanges(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedBylaw(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
