'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import ProfileSettings from '@/components/admin/settings/ProfileSettings';
import FinancialSettings from '@/components/admin/settings/FinancialSettings';
import ProductFactory from '@/components/admin/settings/ProductFactory';
import KYCSettings from '@/components/admin/settings/KYCSettings';

interface TenantSettings {
    id: string;
    name: string;
    code: string;
    registrationNumber: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    maxBorrowingLimit: number;
    liquidityRatioTarget: number;
    kycConfiguration?: {
        documentChecklist: string[];
        customFields: Array<{ name: string; type: string; required: boolean }>;
    };
    workflowConfiguration?: {
        makerCheckerEnabled: boolean;
        approvalHierarchy: string[];
    };
    isMaintenanceMode: boolean;
}

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'financial' | 'products' | 'kyc'>('profile');

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/settings');
            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }
            const data = await response.json();
            setSettings(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!settings) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const response = await fetch('/api/admin/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update settings');
            }

            setSuccess('Settings updated successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    }

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setSettings((prev) => prev ? { ...prev, [name]: value } : null);
    };

    const handleConfigUpdate = (newConfig: any) => {
        setSettings((prev) => prev ? { ...prev, ...newConfig } : null);
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<AdminSidebar />}>
                <div className="p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-64 bg-gray-100 rounded"></div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">System Settings</h1>
                            <p className="text-gray-500 mt-1 font-medium">Manage your organization, financial products, and workflows.</p>
                        </div>
                        {activeTab !== 'products' && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className={`px-8 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-xl shadow-primary-100 transition-all hover:bg-primary-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${saving ? 'animate-pulse' : ''}`}
                            >
                                {saving ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Configuration'
                                )}
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 animate-head-shake">
                            <span className="text-xl">⚠️</span> {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3 animate-bounce-in">
                            <span className="text-xl">✅</span> {success}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                        {/* Improved Tabs UI */}
                        <div className="flex border-b border-gray-100 bg-gray-50/50 p-2 gap-1 overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'profile', label: 'Organization', icon: '🏛️' },
                                { id: 'financial', label: 'Financials', icon: '💰' },
                                { id: 'products', label: 'Product Factory', icon: '⚙️' },
                                { id: 'kyc', label: 'Onboarding & KYC', icon: '📝' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-5 py-3 text-sm font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 md:p-10">
                            {activeTab === 'profile' && (
                                <ProfileSettings settings={settings} onChange={handleChange} />
                            )}

                            {activeTab === 'financial' && (
                                <FinancialSettings settings={settings} onChange={handleChange} />
                            )}

                            {activeTab === 'products' && (
                                <ProductFactory />
                            )}

                            {activeTab === 'kyc' && (
                                <KYCSettings
                                    config={settings?.kycConfiguration}
                                    onUpdate={(cfg) => handleConfigUpdate({ kycConfiguration: cfg })}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
