'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { Calendar as CalendarIcon, Clock, MapPin, Search, ChevronRight, User } from 'lucide-react';

interface Audit {
    id: string;
    scheduledDate: string;
    status: string;
    tenant: { name: string };
    auditor: { fullName: string };
}

export default function ComplianceAuditsPage() {
    const [audits, setAudits] = useState<Audit[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        tenantId: '',
        auditorId: 'CURRENT_USER_ID', // TODO: From context
        scheduledDate: ''
    });

    useEffect(() => {
        fetchAudits();
        fetchTenants();
    }, []);

    const fetchAudits = async () => {
        try {
            const res = await fetch('/api/regulator/compliance/audits');
            const data = await res.json();
            setAudits(data);
        } catch (error) {
            console.error('Error fetching audits:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await fetch('/api/regulator/saccos');
            const data = await res.json();
            setTenants(data.saccos || []);
        } catch (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    const handleSchedule = async () => {
        try {
            const res = await fetch('/api/regulator/compliance/audits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                fetchAudits();
            }
        } catch (error) {
            console.error('Error scheduling audit:', error);
        }
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-display">Compliance Audits</h1>
                        <p className="text-gray-600 mt-2">Manage and schedule periodic on-site compliance audits</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center gap-2"
                    >
                        <CalendarIcon className="w-5 h-5" />
                        Schedule Audit
                    </button>
                </div>

                {/* Audit List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b flex items-center px-8">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search audits..."
                                className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="divide-y">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Loading audits...</div>
                        ) : audits.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No audits scheduled.</div>
                        ) : (
                            audits.map(audit => (
                                <div key={audit.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center gap-6 px-8">
                                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex flex-col items-center justify-center text-primary-600 shrink-0">
                                        <span className="text-xs font-bold uppercase">{new Date(audit.scheduledDate).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-lg font-bold leading-none">{new Date(audit.scheduledDate).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-900">{audit.tenant.name}</h3>
                                        <div className="flex gap-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(audit.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="flex items-center gap-1"><User className="w-4 h-4" /> {audit.auditor.fullName}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${audit.status === 'completed' ? 'bg-success-100 text-success-700' :
                                                audit.status === 'pending' ? 'bg-warning-100 text-warning-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {audit.status}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-gray-300" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Schedule Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6">Schedule Compliance Audit</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select SACCO</label>
                                    <select
                                        value={formData.tenantId}
                                        onChange={e => setFormData({ ...formData, tenantId: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select Tenant</option>
                                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Audit Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.scheduledDate}
                                        onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                                        className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors">Cancel</button>
                                <button onClick={handleSchedule} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all">Schedule</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
