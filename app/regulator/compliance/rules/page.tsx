'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { Plus, Bell, Trash2, ShieldAlert } from 'lucide-react';

interface Rule {
    id: string;
    name: string;
    metric: string;
    operator: string;
    threshold: number;
    severity: string;
    isActive: boolean;
}

export default function ComplianceRulesPage() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        metric: 'kyc_rate',
        operator: 'less_than',
        threshold: 70,
        severity: 'high',
        isActive: true
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/regulator/compliance/rules');
            const data = await res.json();
            setRules(data);
        } catch (error) {
            console.error('Error fetching rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/regulator/compliance/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ name: '', metric: 'kyc_rate', operator: 'less_than', threshold: 70, severity: 'high', isActive: true });
                fetchRules();
            }
        } catch (error) {
            console.error('Error saving rule:', error);
        }
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Automation Rules</h1>
                        <p className="text-gray-600 mt-2">Configure automated alerts based on compliance metrics</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add Rule
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full text-center py-12">Loading rules...</div>
                    ) : rules.length === 0 ? (
                        <div className="col-span-full card p-12 text-center text-gray-500">
                            No automation rules configured. Click "Add Rule" to get started.
                        </div>
                    ) : (
                        rules.map(rule => (
                            <div key={rule.id} className="card p-6 border-l-4 border-primary-500 relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${rule.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                            rule.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                                'bg-blue-100 text-blue-800'
                                        }`}>
                                        {rule.severity}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{rule.name}</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Trigger alert if <span className="font-medium">{rule.metric.replace(/_/g, ' ')}</span> is <span className="font-medium">{rule.operator.replace(/_/g, ' ')}</span> <span className="font-medium">{rule.threshold}%</span>
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-success-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-sm text-gray-600">{rule.isActive ? 'Active' : 'Inactive'}</span>
                                    </div>
                                    <button className="text-gray-400 hover:text-danger-600 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6">Create Automation Rule</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        placeholder="e.g. Critical KYC Drop"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
                                        <select
                                            value={formData.metric}
                                            onChange={e => setFormData({ ...formData, metric: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg outline-none"
                                        >
                                            <option value="kyc_rate">KYC Rate</option>
                                            <option value="financial_timeliness">Reporting Timeliness</option>
                                            <option value="bylaw_adherence">Bylaw Adherence</option>
                                            <option value="compliance_score">Overall Score</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                                        <select
                                            value={formData.operator}
                                            onChange={e => setFormData({ ...formData, operator: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg outline-none"
                                        >
                                            <option value="less_than">Less Than</option>
                                            <option value="greater_than">Greater Than</option>
                                            <option value="equals">Equals</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Threshold (%)</label>
                                        <input
                                            type="number"
                                            value={formData.threshold}
                                            onChange={e => setFormData({ ...formData, threshold: parseInt(e.target.value) })}
                                            className="w-full px-4 py-2 border rounded-lg outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                        <select
                                            value={formData.severity}
                                            onChange={e => setFormData({ ...formData, severity: e.target.value })}
                                            className="w-full px-4 py-2 border rounded-lg outline-none"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-8">
                                <button onClick={() => setShowModal(false)} className="px-6 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
                                <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-200">Save Rule</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
