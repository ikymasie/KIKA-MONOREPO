'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { useRouter } from 'next/navigation';
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

export default function SaccoDetailPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<SaccoDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactMessage, setContactMessage] = useState('');
    const router = useRouter();

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

    async function handleStatusToggle() {
        if (!data) return;

        const newStatus = data.sacco.status === 'active' ? 'suspended' : 'active';
        const action = newStatus === 'active' ? 'activate' : 'suspend';

        if (!confirm(`Are you sure you want to ${action} ${data.sacco.name}?`)) return;

        setProcessing(true);
        try {
            const res = await fetch(`/api/regulator/saccos/${params.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, reason: '' })
            });

            if (res.ok) {
                alert(`SACCO ${action}d successfully`);
                fetchSaccoDetails(); // Refresh data
            } else {
                const error = await res.json();
                alert(`Failed to ${action} SACCO: ${error.error}`);
            }
        } catch (err) {
            console.error(err);
            alert(`Error: ${err}`);
        } finally {
            setProcessing(false);
        }
    }

    function handleContactSacco() {
        if (!data?.sacco.contactEmail) {
            alert('No contact email available for this SACCO');
            return;
        }
        setShowContactModal(true);
    }

    function handleSendEmail() {
        if (!data?.sacco.contactEmail) return;

        const subject = encodeURIComponent(`Regulatory Communication - ${data.sacco.name}`);
        const body = encodeURIComponent(contactMessage);
        window.location.href = `mailto:${data.sacco.contactEmail}?subject=${subject}&body=${body}`;

        setShowContactModal(false);
        setContactMessage('');
    }

    const formatCurrency = (amount: number) => {
        return `P ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'active') return <span className="px-3 py-1 rounded-full text-sm font-medium bg-success-100 text-success-800">Active</span>;
        if (s === 'suspended') return <span className="px-3 py-1 rounded-full text-sm font-medium bg-danger-100 text-danger-800">Suspended</span>;
        return <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{status}</span>;
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<RegulatorSidebar />}>
                <div className="p-8 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading SACCO details...</p>
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
                    <Link href="/regulator/saccos" className="btn btn-secondary mt-4">
                        ← Back to Directory
                    </Link>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                {/* Header */}
                <div className="mb-6">
                    <Link href="/regulator/saccos" className="text-primary-600 hover:text-primary-800 mb-2 inline-block">
                        ← Back to Directory
                    </Link>
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{data.sacco.name}</h1>
                            <p className="text-gray-600 mt-1">Reg No: {data.sacco.registrationNumber}</p>
                        </div>
                        <div className="flex gap-3">
                            {getStatusBadge(data.sacco.status)}
                        </div>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <div className="text-sm text-blue-800 font-medium mb-1">Total Members</div>
                        <div className="text-3xl font-bold text-blue-900">{data.members.total}</div>
                    </div>
                    <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
                        <div className="text-sm text-green-800 font-medium mb-1">Total Savings</div>
                        <div className="text-3xl font-bold text-green-900">{formatCurrency(data.financial.totalSavings)}</div>
                    </div>
                    <div className="card p-6 bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100">
                        <div className="text-sm text-purple-800 font-medium mb-1">Active Loans</div>
                        <div className="text-3xl font-bold text-purple-900">{data.financial.loans.active}</div>
                    </div>
                    <div className="card p-6 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100">
                        <div className="text-sm text-orange-800 font-medium mb-1">Outstanding</div>
                        <div className="text-3xl font-bold text-orange-900">{formatCurrency(data.financial.loans.totalOutstanding)}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Contact Information */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 border-b pb-2">Contact Information</h2>
                            <dl className="grid grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm text-gray-500">Address</dt>
                                    <dd className="font-medium text-gray-900">{data.sacco.address || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Email</dt>
                                    <dd className="font-medium text-gray-900">{data.sacco.contactEmail || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Phone</dt>
                                    <dd className="font-medium text-gray-900">{data.sacco.contactPhone || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">Registered</dt>
                                    <dd className="font-medium text-gray-900">{new Date(data.sacco.createdAt).toLocaleDateString()}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* Financial Overview */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 border-b pb-2">Financial Overview</h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-500">Total Loans Disbursed</div>
                                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.financial.loans.totalDisbursed)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Portfolio at Risk</div>
                                        <div className={`text-2xl font-bold ${data.financial.loans.portfolioAtRisk > 5 ? 'text-danger-600' : 'text-success-600'}`}>
                                            {data.financial.loans.portfolioAtRisk.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Account Types Breakdown */}
                                <div className="mt-4">
                                    <h3 className="font-semibold mb-2">Accounts by Type</h3>
                                    <div className="space-y-2">
                                        {data.financial.accountsByType.map((acc, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                <span className="capitalize">{acc.type}</span>
                                                <div className="text-right">
                                                    <div className="font-medium">{acc.count} accounts</div>
                                                    <div className="text-sm text-gray-600">{formatCurrency(parseFloat(acc.total))}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 border-b pb-2">Recent Activity</h2>
                            {data.recentActivity.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No recent activity</p>
                            ) : (
                                <div className="space-y-3">
                                    {data.recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                            <div>
                                                <div className="font-medium capitalize">{activity.type}</div>
                                                <div className="text-sm text-gray-600">{activity.memberName}</div>
                                                <div className="text-xs text-gray-500">{new Date(activity.createdAt).toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900">{formatCurrency(activity.amount)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Compliance Status */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 border-b pb-2">Compliance Status</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Registration</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${data.compliance.hasActiveRegistration ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'}`}>
                                        {data.compliance.hasActiveRegistration ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Liquidity Ratio</span>
                                    <span className="font-medium">{data.compliance.liquidityRatio}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Overall Status</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${data.compliance.isCompliant ? 'bg-success-100 text-success-800' : 'bg-warning-100 text-warning-800'}`}>
                                        {data.compliance.isCompliant ? 'Compliant' : 'Non-Compliant'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Member Statistics */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 border-b pb-2">Member Statistics</h2>
                            <div className="space-y-2">
                                {data.members.byStatus.map((stat, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                        <span className="capitalize text-sm">{stat.status}</span>
                                        <span className="font-medium">{stat.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="card p-6">
                            <h2 className="text-xl font-bold mb-4 border-b pb-2">Actions</h2>
                            <div className="space-y-2">
                                <Link
                                    href={`/regulator/saccos/${params.id}/report`}
                                    className="btn btn-outline w-full text-center"
                                >
                                    📊 View Full Report
                                </Link>
                                <button
                                    onClick={handleContactSacco}
                                    className="btn btn-outline w-full"
                                >
                                    📧 Contact SACCO
                                </button>
                                {data.sacco.status === 'active' ? (
                                    <button
                                        onClick={handleStatusToggle}
                                        disabled={processing}
                                        className="btn bg-warning-600 hover:bg-warning-700 text-white w-full disabled:opacity-50"
                                    >
                                        {processing ? 'Processing...' : '⚠️ Suspend SACCO'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleStatusToggle}
                                        disabled={processing}
                                        className="btn bg-success-600 hover:bg-success-700 text-white w-full disabled:opacity-50"
                                    >
                                        {processing ? 'Processing...' : '✓ Activate SACCO'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Contact {data?.sacco.name}</h3>
                        <div className="mb-4">
                            <label className="label">Email To:</label>
                            <input
                                type="text"
                                className="input w-full"
                                value={data?.sacco.contactEmail || ''}
                                disabled
                            />
                        </div>
                        <div className="mb-4">
                            <label className="label">Message:</label>
                            <textarea
                                className="input w-full h-32"
                                placeholder="Enter your message..."
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                            ></textarea>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowContactModal(false);
                                    setContactMessage('');
                                }}
                                className="btn btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={!contactMessage.trim()}
                                className="btn btn-primary flex-1 disabled:opacity-50"
                            >
                                Open Email Client
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
