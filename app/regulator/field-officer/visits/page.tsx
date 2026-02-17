'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import Link from 'next/link';

interface Visit {
    id: string;
    tenant: { id: string; name: string };
    scheduledDate: string;
    purpose: string;
    status: string;
}

interface Saccos {
    id: string;
    name: string;
}

export default function FieldVisitsPage() {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [saccosList, setSaccosList] = useState<Saccos[]>([]);
    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        tenantId: '',
        scheduledDate: '',
        purpose: '',
        notes: '',
    });

    useEffect(() => {
        fetchVisits();
        fetchSaccos();
    }, []);

    const fetchVisits = async () => {
        try {
            const res = await fetch('/api/regulator/field-visits');
            if (res.ok) {
                const data = await res.json();
                setVisits(data);
            }
        } catch (error) {
            console.error('Failed to fetch visits:', error);
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

    const handleScheduleVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/regulator/field-visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowScheduleForm(false);
                setFormData({ tenantId: '', scheduledDate: '', purpose: '', notes: '' });
                fetchVisits();
            }
        } catch (error) {
            console.error('Failed to schedule visit:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'scheduled': return 'bg-primary-100 text-primary-700';
            case 'in_progress': return 'bg-warning-100 text-warning-700';
            case 'completed': return 'bg-success-100 text-success-700';
            case 'cancelled': return 'bg-danger-100 text-danger-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Field Visits</h1>
                        <p className="text-gray-600">Track and manage on-site inspections.</p>
                    </div>
                    <button
                        onClick={() => setShowScheduleForm(true)}
                        className="btn btn-primary"
                    >
                        Schedule Visit
                    </button>
                </div>

                {showScheduleForm && (
                    <div className="card p-6 mb-8 border-primary-100 shadow-lg">
                        <h2 className="text-lg font-bold mb-4">Schedule New Visit</h2>
                        <form onSubmit={handleScheduleVisit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <label className="label">Scheduled Date</label>
                                <input
                                    required
                                    type="datetime-local"
                                    className="input"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group md:col-span-2">
                                <label className="label">Purpose</label>
                                <input
                                    required
                                    placeholder="e.g., Annual compliance inspection, Liquidity assessment"
                                    className="input"
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                />
                            </div>
                            <div className="form-group md:col-span-2">
                                <label className="label">Notes (Optional)</label>
                                <textarea
                                    className="input h-20"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowScheduleForm(false)} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Schedule Visit</button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="card overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">SACCO</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Date & Time</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Purpose</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {visits.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No field visits scheduled.</td>
                                </tr>
                            ) : (
                                visits.map((visit) => (
                                    <tr key={visit.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium">{visit.tenant.name}</td>
                                        <td className="px-6 py-4">{new Date(visit.scheduledDate).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{visit.purpose}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(visit.status)}`}>
                                                {visit.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {visit.status === 'scheduled' && (
                                                <Link href={`/regulator/field-officer/visits/${visit.id}/report`} className="text-primary-600 hover:text-primary-800 font-semibold">
                                                    Start Inspection →
                                                </Link>
                                            )}
                                            {visit.status === 'completed' && (
                                                <span className="text-gray-400 italic">Report Submitted</span>
                                            )}
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
