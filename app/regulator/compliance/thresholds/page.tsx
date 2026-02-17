'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { Save, Info, CheckCircle2 } from 'lucide-react';

export default function ComplianceThresholdsPage() {
    const [thresholds, setThresholds] = useState({
        excellentThreshold: 90,
        goodThreshold: 75,
        fairThreshold: 60,
        poorThreshold: 40
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchThresholds();
    }, []);

    const fetchThresholds = async () => {
        try {
            const res = await fetch('/api/regulator/compliance/thresholds');
            const data = await res.json();
            setThresholds(data);
        } catch (error) {
            console.error('Error fetching thresholds:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/regulator/compliance/thresholds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(thresholds)
            });
            if (res.ok) {
                setMessage({ type: 'success', text: 'Thresholds updated successfully!' });
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update thresholds.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 text-center">Scoring Thresholds</h1>
                    <p className="text-gray-600 mt-2 text-center">Define the criteria for SACCO compliance ratings</p>
                </div>

                <div className="card p-8 bg-white shadow-xl rounded-2xl border border-gray-100">
                    <div className="space-y-8">
                        {/* Summary Info */}
                        <div className="p-4 bg-primary-50 rounded-xl flex gap-4 items-start border border-primary-100">
                            <Info className="w-6 h-6 text-primary-600 shrink-0 mt-0.5" />
                            <p className="text-sm text-primary-800">
                                These thresholds determine the automatic rating (Excellent, Good, etc.) assigned to SACCOs based on their weighted compliance score (0-100).
                            </p>
                        </div>

                        {/* Threshold Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { key: 'excellentThreshold', label: 'Excellent Rating ≥', color: 'text-success-600', bg: 'bg-success-50' },
                                { key: 'goodThreshold', label: 'Good Rating ≥', color: 'text-primary-600', bg: 'bg-primary-50' },
                                { key: 'fairThreshold', label: 'Fair Rating ≥', color: 'text-warning-600', bg: 'bg-warning-50' },
                                { key: 'poorThreshold', label: 'Poor Rating ≥', color: 'text-danger-600', bg: 'bg-danger-50' },
                            ].map((item) => (
                                <div key={item.key} className="space-y-2">
                                    <label className={`block text-sm font-bold ${item.color}`}>{item.label}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={thresholds[item.key as keyof typeof thresholds]}
                                            onChange={(e) => setThresholds({ ...thresholds, [item.key]: parseFloat(e.target.value) })}
                                            className={`w-full px-6 py-4 text-2xl font-bold rounded-xl border focus:ring-4 focus:ring-primary-100 outline-none transition-all ${item.bg}`}
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Visual Range Indicator */}
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Rating Distribution Preview</h3>
                            <div className="h-6 w-full flex rounded-full overflow-hidden shadow-inner border border-gray-100">
                                <div className="bg-success-500 h-full" style={{ width: `${100 - thresholds.excellentThreshold}%` }}></div>
                                <div className="bg-primary-500 h-full" style={{ width: `${thresholds.excellentThreshold - thresholds.goodThreshold}%` }}></div>
                                <div className="bg-warning-500 h-full" style={{ width: `${thresholds.goodThreshold - thresholds.fairThreshold}%` }}></div>
                                <div className="bg-orange-500 h-full" style={{ width: `${thresholds.fairThreshold - thresholds.poorThreshold}%` }}></div>
                                <div className="bg-danger-500 h-full" style={{ width: `${thresholds.poorThreshold}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                <span>Excellent</span>
                                <span>Good</span>
                                <span>Fair</span>
                                <span>Poor</span>
                                <span>Critical</span>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-6 border-t flex flex-col items-center gap-4">
                            {message && (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'}`}>
                                    {message.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                    {message.text}
                                </div>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full md:w-64 py-4 bg-primary-600 text-white rounded-xl font-bold shadow-xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                {saving ? 'Saving...' : 'Update Thresholds'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
