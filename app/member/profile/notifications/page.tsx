'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';

interface Preferences {
    email: Record<string, boolean>;
    sms: Record<string, boolean>;
    push: Record<string, boolean>;
}

export default function NotificationPreferencesPage() {
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const res = await fetch('/api/member/notifications/preferences');
            if (res.ok) {
                const data = await res.json();
                setPreferences(data);
            }
        } catch (error) {
            console.error('Failed to fetch preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (channel: keyof Preferences, key: string) => {
        if (!preferences) return;
        setPreferences({
            ...preferences,
            [channel]: {
                ...preferences[channel],
                [key]: !preferences[channel][key]
            }
        });
    };

    const savePreferences = async () => {
        if (!preferences) return;
        try {
            setSaving(true);
            const res = await fetch('/api/member/notifications/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences)
            });
            if (res.ok) {
                alert('Preferences saved successfully');
            }
        } catch (error) {
            console.error('Failed to save preferences:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        </DashboardLayout>
    );

    const labels: Record<string, string> = {
        loanUpdates: 'Loan Status & Repayments',
        savingsUpdates: 'Savings & Contributions',
        marketing: 'Special Offers & News',
        security: 'Account Security Alerts'
    };

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Notification Preferences</h1>
                        <p className="text-gray-500 font-medium text-lg mt-2">Choose how and when you want to be notified by KIKA.</p>
                    </div>
                    <button
                        onClick={savePreferences}
                        disabled={saving}
                        className="py-4 px-10 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="space-y-8">
                    {(['email', 'sms', 'push'] as const).map((channel) => (
                        <div key={channel} className="glass-panel overflow-hidden bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                            <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-2xl">
                                    {channel === 'email' ? '📧' : channel === 'sms' ? '📱' : '🔔'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 capitalize">{channel} Notifications</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage {channel} alerts</p>
                                </div>
                            </div>
                            <div className="p-8 divide-y divide-gray-50">
                                {Object.keys(preferences?.[channel] || {}).map((key) => (
                                    <div key={key} className="py-6 first:pt-0 last:pb-0 flex justify-between items-center group">
                                        <div>
                                            <p className="font-bold text-gray-900">{labels[key] || key}</p>
                                            <p className="text-sm text-gray-500">Get alerts for {labels[key]?.toLowerCase() || key}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={preferences?.[channel][key] || false}
                                                onChange={() => handleToggle(channel, key)}
                                            />
                                            <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
