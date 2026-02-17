'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface Investigation {
    id: string;
    tenant: { name: string };
    subject: string;
    status: string;
    severity: string;
    createdAt: string;
}

interface Saccos {
    id: string;
    name: string;
}

export default function InvestigationsPage() {
    const [investigations, setInvestigations] = useState<Investigation[]>([]);
    const [saccosList, setSaccosList] = useState<Saccos[]>([]);
    const [showInitiateForm, setShowInitiateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        tenantId: '',
        subject: '',
        description: '',
        severity: 'medium',
    });

    useEffect(() => {
        fetchInvestigations();
        fetchSaccos();
    }, []);

    const fetchInvestigations = async () => {
        try {
            const res = await fetch('/api/regulator/investigations');
            if (res.ok) {
                const data = await res.json();
                setInvestigations(data);
            }
        } catch (error) {
            console.error('Failed to fetch investigations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSaccos = async () => {
        try {
            const res = await fetch('/api/regulator/saccos');
            if (res.ok) {
                const data = await res.json();
                setSaccosList(data.saccos);
            }
        } catch (error) {
            console.error('Failed to fetch SACCOS:', error);
        }
    };

    const handleInitiateInvestigation = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/regulator/investigations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowInitiateForm(false);
                setFormData({ tenantId: '', subject: '', description: '', severity: 'medium' });
                fetchInvestigations();
            }
        } catch (error) {
            console.error('Failed to initiate investigation:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-danger-100 text-danger-700';
            case 'under_review': return 'bg-warning-100 text-warning-700';
            case 'completed': return 'bg-success-100 text-success-700';
            case 'closed': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-danger-600 font-bold';
            case 'high': return 'text-warning-600 font-bold';
            case 'medium': return 'text-primary-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Compliance Investigations</h1>
                        <p className="text-gray-600">Track and manage regulatory investigations.</p>
                    </div>
                    <button
                        onClick={() => setShowInitiateForm(true)}
                        className="btn btn-primary"
                    >
                        Initiate Investigation
                    </button>
                </div>

                {showInitiateForm && (
                    <div className="card p-6 mb-8 border-warning-100 shadow-lg">
                        <h2 className="text-lg font-bold mb-4">Initiate New Investigation</h2>
                        <form onSubmit={handleInitiateInvestigation} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="label">Target SACCO</label>
                                    <select
                                        required
                                        className="input"
                                        value={formData.tenantId}
                                        onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                                    >
                                        <option value="">Select a SACCO</option>
                                        {saccosList.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="label">Severity Level</label>
                                    <select
                                        className="input"
                                        value={formData.severity}
                                        onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Subject / Allegation</label>
                                <input
                                    required
                                    placeholder="e.g., Suspicion of financial mismanagement"
                                    className="input"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Details & Scope</label>
                                <textarea
                                    required
                                    className="input h-32"
                                    placeholder="Provide detailed background and scope of the investigation..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowInitiateForm(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Initiate</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Subject</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">SACCO</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Severity</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Started</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {investigations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No active investigations.</td>
                                </tr>
                            ) : (
                                investigations.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{inv.subject}</td>
                                        <td className="px-6 py-4 text-sm">{inv.tenant.name}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs uppercase font-bold ${getSeverityColor(inv.severity)} uppercase`}>
                                                {inv.severity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(inv.status)}`}>
                                                {inv.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary-600 hover:text-primary-800 font-semibold text-sm">
                                                Update Findings
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}
