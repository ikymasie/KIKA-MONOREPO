'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, TrendingUp, TrendingDown } from 'lucide-react';

interface ComplianceStats {
    totalIssues: number;
    openIssues: number;
    criticalIssues: number;
}

interface ComplianceIssue {
    id: string;
    tenant: { name: string };
    issueType: string;
    severity: string;
    status: string;
    description: string;
    identifiedDate: string;
}

export default function CompliancePage() {
    const [stats, setStats] = useState<ComplianceStats>({ totalIssues: 0, openIssues: 0, criticalIssues: 0 });
    const [issues, setIssues] = useState<ComplianceIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [tenants, setTenants] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        tenantId: '',
        issueType: 'bylaw_violation',
        severity: 'medium',
        description: '',
    });

    useEffect(() => {
        fetchDashboard();
        fetchIssues();
        fetchTenants();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await fetch('/api/regulator/compliance');
            const data = await response.json();
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        }
    };

    const fetchIssues = async () => {
        try {
            const response = await fetch('/api/regulator/compliance/issues');
            const data = await response.json();
            setIssues(data.issues || []);
        } catch (error) {
            console.error('Error fetching issues:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const response = await fetch('/api/regulator/saccos');
            const data = await response.json();
            setTenants(data.saccos || []);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const handleCreate = async () => {
        try {
            const response = await fetch('/api/regulator/compliance/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowCreateModal(false);
                setFormData({
                    tenantId: '',
                    issueType: 'bylaw_violation',
                    severity: 'medium',
                    description: '',
                });
                fetchDashboard();
                fetchIssues();
            }
        } catch (error) {
            console.error('Error creating issue:', error);
        }
    };

    const getSeverityBadge = (severity: string) => {
        const styles = {
            low: 'bg-blue-100 text-blue-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            critical: 'bg-red-100 text-red-800',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity as keyof typeof styles]}`}>
                {severity.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="p-8">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Compliance Monitoring</h1>
                    <p className="text-gray-600 mt-2">Track and manage compliance issues across all SACCOS</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                    <Plus className="w-5 h-5" />
                    <span>Create Issue</span>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Issues</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalIssues}</p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-gray-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Open Issues</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">{stats.openIssues}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-orange-400" />
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Critical Issues</p>
                            <p className="text-3xl font-bold text-red-600 mt-2">{stats.criticalIssues}</p>
                        </div>
                        <AlertTriangle className="w-12 h-12 text-red-400" />
                    </div>
                </div>
            </div>

            {/* Issues Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                SACCOS
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Issue Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Severity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Identified Date
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
                        ) : issues.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                    No issues found
                                </td>
                            </tr>
                        ) : (
                            issues.map((issue) => (
                                <tr key={issue.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {issue.tenant.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {issue.issueType.replace(/_/g, ' ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getSeverityBadge(issue.severity)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {issue.status}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(issue.identifiedDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Create Compliance Issue</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SACCOS *
                                </label>
                                <select
                                    value={formData.tenantId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tenantId: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                >
                                    <option value="">Select SACCOS</option>
                                    {tenants.map((tenant) => (
                                        <option key={tenant.id} value={tenant.id}>
                                            {tenant.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Issue Type *
                                </label>
                                <select
                                    value={formData.issueType}
                                    onChange={(e) =>
                                        setFormData({ ...formData, issueType: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="bylaw_violation">Bylaw Violation</option>
                                    <option value="reporting_delay">Reporting Delay</option>
                                    <option value="governance_issue">Governance Issue</option>
                                    <option value="financial_irregularity">Financial Irregularity</option>
                                    <option value="kyc_compliance">KYC Compliance</option>
                                    <option value="operational_issue">Operational Issue</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Severity *
                                </label>
                                <select
                                    value={formData.severity}
                                    onChange={(e) =>
                                        setFormData({ ...formData, severity: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!formData.tenantId || !formData.description}
                                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                            >
                                Create Issue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
