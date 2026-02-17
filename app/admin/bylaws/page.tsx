'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { formatRelativeTime } from '@/lib/dashboard-utils';

export default function BylawsPage() {
    const [bylaws, setBylaws] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ version: '', documentUrl: '', notes: '' });

    useEffect(() => {
        fetchBylaws();
    }, []);

    const fetchBylaws = async () => {
        try {
            const res = await fetch('/api/admin/bylaws');
            const data = await res.json();
            setBylaws(data.bylaws || []);
            setReviews(data.reviews || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/admin/bylaws', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                setShowModal(false);
                setFormData({ version: '', documentUrl: '', notes: '' });
                fetchBylaws();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Bye-laws Management</h1>
                        <p className="text-gray-500">Manage organization bye-laws and regulatory compliance.</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary"
                    >
                        Submit New Version
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Active Bye-laws */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">Approved Bye-laws</h2>
                        {bylaws.length > 0 ? (
                            <div className="space-y-4">
                                {bylaws.map((bl) => (
                                    <div key={bl.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                                        <div>
                                            <div className="font-bold">Version {bl.version}</div>
                                            <div className="text-sm text-gray-500">Effective: {new Date(bl.effectiveDate).toLocaleDateString()}</div>
                                        </div>
                                        <a href={bl.documentUrl} target="_blank" className="text-primary-600 hover:underline">Download</a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed">
                                No approved bye-laws found.
                            </div>
                        )}
                    </div>

                    {/* Review History */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-4">Submission History</h2>
                        <div className="space-y-4">
                            {reviews.map((rev) => (
                                <div key={rev.id} className="p-4 border border-gray-100 rounded-lg">
                                    <div className="flex justify-between mb-2">
                                        <div className="font-semibold text-gray-900">Version {rev.version}</div>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${rev.status === 'approved' ? 'bg-success-50 text-success-700' :
                                                rev.status === 'rejected' ? 'bg-danger-50 text-danger-700' :
                                                    'bg-warning-50 text-warning-700'
                                            }`}>
                                            {rev.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2 truncate">{rev.reviewNotes || 'No notes provided'}</div>
                                    <div className="text-xs text-gray-400">{formatRelativeTime(new Date(rev.submittedAt))}</div>
                                </div>
                            ))}
                            {reviews.length === 0 && (
                                <p className="text-center text-gray-500">No submissions yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <h2 className="text-2xl font-bold mb-6">Submit for Review</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Version Number</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        placeholder="e.g. 2"
                                        value={formData.version}
                                        onChange={e => setFormData({ ...formData, version: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Document URL</label>
                                    <input
                                        type="url"
                                        className="input w-full"
                                        placeholder="https://..."
                                        value={formData.documentUrl}
                                        onChange={e => setFormData({ ...formData, documentUrl: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        className="input w-full"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn btn-primary flex-1"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
