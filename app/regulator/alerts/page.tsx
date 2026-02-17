'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';

interface Alert {
    id: string;
    type: string;
    severity: string;
    title: string;
    description: string;
    metadata?: Record<string, any>;
    isResolved: boolean;
    resolvedAt?: string;
    createdAt: string;
    tenant: {
        id: string;
        name: string;
    };
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [severityFilter, setSeverityFilter] = useState<string>('');
    const [resolvedFilter, setResolvedFilter] = useState<string>('false');

    useEffect(() => {
        fetchAlerts();
    }, [severityFilter, resolvedFilter]);

    async function fetchAlerts() {
        try {
            const params = new URLSearchParams();
            if (severityFilter) params.append('severity', severityFilter);
            if (resolvedFilter) params.append('resolved', resolvedFilter);

            const res = await fetch(`/api/regulator/alerts?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setAlerts(data);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateAlerts() {
        if (!confirm('Generate new alerts based on current SACCO metrics?')) return;

        try {
            const res = await fetch('/api/regulator/alerts', { method: 'POST' });
            if (res.ok) {
                alert('Alerts generated successfully');
                fetchAlerts();
            } else {
                alert('Failed to generate alerts');
            }
        } catch (error) {
            console.error('Error generating alerts:', error);
            alert('Error generating alerts');
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-danger-100 text-danger-800 border-danger-300';
            case 'high': return 'bg-warning-100 text-warning-800 border-warning-300';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getSeverityBadge = (severity: string) => {
        const colors = {
            critical: 'bg-danger-600',
            high: 'bg-warning-600',
            medium: 'bg-yellow-600',
            low: 'bg-gray-600'
        };
        return colors[severity as keyof typeof colors] || 'bg-gray-600';
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Regulatory Alerts</h1>
                        <p className="text-gray-600">Monitor and manage compliance alerts across all SACCOs</p>
                    </div>
                    <button
                        onClick={handleGenerateAlerts}
                        className="btn btn-primary"
                    >
                        🔄 Generate New Alerts
                    </button>
                </div>

                {/* Filters */}
                <div className="card p-4 mb-6 flex gap-4 items-center">
                    <div>
                        <label className="label text-sm">Severity</label>
                        <select
                            className="input"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                        >
                            <option value="">All Severities</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>
                    </div>
                    <div>
                        <label className="label text-sm">Status</label>
                        <select
                            className="input"
                            value={resolvedFilter}
                            onChange={(e) => setResolvedFilter(e.target.value)}
                        >
                            <option value="false">Active Only</option>
                            <option value="true">Resolved Only</option>
                            <option value="">All Alerts</option>
                        </select>
                    </div>
                    <div className="ml-auto">
                        <div className="text-sm text-gray-600">
                            Showing {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* Alerts List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading alerts...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="card p-12 text-center">
                        <p className="text-gray-500 text-lg">No alerts found</p>
                        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or generate new alerts</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <div key={alert.id} className={`card p-6 border-l-4 ${getSeverityColor(alert.severity)}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${getSeverityBadge(alert.severity)}`}></div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold uppercase text-xs tracking-wide">{alert.severity}</span>
                                                <span className="text-gray-400">•</span>
                                                <span className="text-sm text-gray-600 capitalize">{alert.type.replace(/_/g, ' ')}</span>
                                            </div>
                                            <h3 className="font-bold text-lg">{alert.title}</h3>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">
                                            {new Date(alert.createdAt).toLocaleDateString()}
                                        </div>
                                        {alert.isResolved && (
                                            <span className="inline-block mt-1 px-2 py-1 bg-success-100 text-success-800 text-xs rounded">
                                                Resolved
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-gray-700 mb-3">{alert.description}</p>

                                <div className="flex justify-between items-center pt-3 border-t">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">SACCO:</span>
                                        <Link
                                            href={`/regulator/saccos/${alert.tenant.id}`}
                                            className="text-primary-600 hover:text-primary-800 font-medium"
                                        >
                                            {alert.tenant.name}
                                        </Link>
                                    </div>
                                    {alert.metadata && (
                                        <div className="text-xs text-gray-500">
                                            {Object.entries(alert.metadata).map(([key, value]) => (
                                                <span key={key} className="ml-3">
                                                    {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
