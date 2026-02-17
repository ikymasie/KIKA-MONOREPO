'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';

interface Tenant {
    id: string;
    name: string;
    code: string;
}

export default function RequestAccessPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        tenantId: '',
        startDate: '',
        endDate: '',
        purpose: '',
    });

    useEffect(() => {
        async function fetchTenants() {
            try {
                const res = await fetch('/api/regulator/saccos'); // Reuse existing SACCOS list endpoint
                if (res.ok) {
                    const data = await res.json();
                    setTenants(data);
                }
            } catch (e) {
                console.error('Error fetching tenants:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchTenants();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/external-auditor/access-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert('Access request submitted successfully!');
                router.push('/auditor/dashboard');
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit request');
            }
        } catch (e) {
            console.error('Error submitting request:', e);
            alert('An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Request Audit Access</h1>
                <p className="text-gray-600">Submit a request to access a SACCOS's financial records for auditing purposes.</p>
            </div>

            <div className="glass-panel p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select SACCOS</label>
                        <select
                            className="input w-full"
                            value={formData.tenantId}
                            onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                            required
                        >
                            <option value="">Select an organization...</option>
                            {tenants.map((t) => (
                                <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Access Start Date</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Access End Date</label>
                            <input
                                type="date"
                                className="input w-full"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Audit Purpose</label>
                        <textarea
                            className="input w-full h-32 py-3"
                            placeholder="Describe the scope and purpose of this audit..."
                            value={formData.purpose}
                            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                            required
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary px-8"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
