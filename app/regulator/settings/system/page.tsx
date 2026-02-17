'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

export default function SystemSettingsPage() {
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [globalDeductionLimit, setGlobalDeductionLimit] = useState(50);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // In a real implementation, this would call an API
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage({ type: 'success', text: 'System settings updated successfully.' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update system settings.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Platform Management</h1>
                        <p className="text-gray-500 mt-1">Configure system-wide settings and limits for the entire KIKA platform.</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`btn btn-primary px-6 py-2 flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {saving ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : 'Save Changes'}
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-success-50 border-success-200 text-success-700' : 'bg-danger-50 border-danger-200 text-danger-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-8">
                    {/* General Settings */}
                    <div className="card p-6 glass-panel">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <span className="text-2xl">⚙️</span> General Configuration
                        </h2>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-white/40 rounded-xl border border-white/20">
                                <div>
                                    <h3 className="font-medium text-gray-900">Platform Maintenance Mode</h3>
                                    <p className="text-sm text-gray-500">Enable this to prevent all non-admin users from accessing the platform.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={maintenanceMode}
                                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Global Maximum Deduction Limit (%)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={globalDeductionLimit}
                                        onChange={(e) => setGlobalDeductionLimit(parseInt(e.target.value))}
                                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                    <span className="w-12 text-center font-bold text-primary-700 bg-primary-50 py-1 rounded-lg border border-primary-100">
                                        {globalDeductionLimit}%
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">Standardized limit applied across all SACCOS for combined member deductions.</p>
                            </div>
                        </div>
                    </div>

                    {/* Security & Access */}
                    <div className="card p-6 glass-panel">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <span className="text-2xl">🛡️</span> Security & Compliance
                        </h2>

                        <div className="space-y-4">
                            <div className="p-4 bg-white/40 rounded-xl border border-white/20">
                                <h3 className="font-medium text-gray-900 mb-1">Enforce Global MFA</h3>
                                <p className="text-sm text-gray-500 mb-3">Require Multi-Factor Authentication for all regulatory roles system-wide.</p>
                                <button className="text-sm font-semibold text-primary-600 hover:text-primary-700">Currently Active (Hardcoded in RBAC) →</button>
                            </div>

                            <div className="p-4 bg-white/40 rounded-xl border border-white/20">
                                <h3 className="font-medium text-gray-900 mb-1">Session Timeout (Minutes)</h3>
                                <p className="text-sm text-gray-500 mb-3">Automatically sign out inactive users after these many minutes.</p>
                                <input
                                    type="number"
                                    defaultValue={30}
                                    className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="card p-6 border-danger-200 bg-danger-50/30">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-danger-700">
                            <span className="text-2xl">⚠️</span> Danger Zone
                        </h2>

                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-medium text-gray-900">Reset Platform Cache</h3>
                                <p className="text-sm text-gray-500">Clear all cached data system-wide. May cause temporary performance drop.</p>
                            </div>
                            <button className="px-4 py-2 border border-danger-300 text-danger-700 rounded-xl hover:bg-danger-100 transition-colors font-medium">Reset Cache</button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
