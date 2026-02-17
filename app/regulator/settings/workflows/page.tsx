'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

const WORKFLOW_STAGES = [
    { key: 'initial_review', label: 'Initial Review' },
    { key: 'security_vetting', label: 'Security Vetting' },
    { key: 'legal_review', label: 'Legal Review' },
    { key: 'final_decision', label: 'Final Decision' },
    { key: 'appeal_review', label: 'Appeal Review' },
];

const ROLE_OPTIONS = [
    { value: 'registry_clerk', label: 'Registry Clerk' },
    { value: 'intelligence_liaison', label: 'Intelligence Liaison' },
    { value: 'legal_officer', label: 'Legal Officer' },
    { value: 'registrar', label: 'Registrar' },
    { value: 'dcd_director', label: 'DCD Director' },
    { value: 'dcd_field_officer', label: 'DCD Field Officer' },
    { value: 'dcd_compliance_officer', label: 'DCD Compliance Officer' },
];

export default function WorkflowConfigPage() {
    const [config, setConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    async function fetchConfig() {
        try {
            const res = await fetch('/api/regulator/settings');
            if (res.ok) {
                const data = await res.json();
                setConfig(data.workflowConfig || {});
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch('/api/regulator/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workflowConfig: config })
            });

            if (res.ok) {
                alert('Workflow configuration saved successfully');
            } else {
                alert('Failed to save configuration');
            }
        } catch (e) {
            console.error(e);
            alert('Error saving configuration');
        } finally {
            setSaving(false);
        }
    }

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Workflow Configuration</h1>
                    <p className="text-gray-600">Assign responsible roles for each application workflow stage</p>
                </div>

                <div className="card">
                    <div className="space-y-6">
                        {WORKFLOW_STAGES.map((stage) => (
                            <div key={stage.key} className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="label">{stage.label}</label>
                                    <p className="text-xs text-gray-500">Who should be notified when an application reaches this stage?</p>
                                </div>
                                <div className="w-64">
                                    <select
                                        className="input w-full"
                                        value={config[stage.key] || ''}
                                        onChange={(e) => setConfig({ ...config, [stage.key]: e.target.value })}
                                    >
                                        <option value="">-- Select Role --</option>
                                        {ROLE_OPTIONS.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary"
                        >
                            {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How it works</h3>
                    <p className="text-sm text-blue-800">
                        When an application moves to a configured stage, all users with the assigned role will receive an email notification.
                        Make sure users are created in the <a href="/regulator/settings/users" className="underline font-medium">User Management</a> page.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
