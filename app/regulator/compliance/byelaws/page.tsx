'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface ByelawReview {
    id: string;
    tenant: {
        id: string;
        name: string;
    };
    bylawDocumentUrl: string;
    submittedAt: string;
    status: string;
    reviewNotes?: string;
    version: number;
}

export default function ByelawsReviewPage() {
    const [reviews, setReviews] = useState<ByelawReview[]>([]);
    const [selectedReview, setSelectedReview] = useState<ByelawReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchReviews();
    }, []);

    async function fetchReviews() {
        try {
            const response = await fetch('/api/regulator/byelaws/pending');
            if (!response.ok) throw new Error('Failed to fetch bye-laws reviews');
            const data = await response.json();
            setReviews(data.reviews || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function approveByelaws() {
        if (!selectedReview) return;
        if (!notes.trim()) {
            alert('Please provide approval notes');
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/regulator/byelaws/${selectedReview.id}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes }),
            });

            if (!response.ok) throw new Error('Failed to approve bye-laws');

            alert('Bye-laws approved successfully');
            setNotes('');
            setSelectedReview(null);
            await fetchReviews();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    }

    async function rejectByelaws() {
        if (!selectedReview) return;
        if (!notes.trim()) {
            alert('Please provide rejection reason');
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/regulator/byelaws/${selectedReview.id}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: notes }),
            });

            if (!response.ok) throw new Error('Failed to reject bye-laws');

            alert('Bye-laws rejected');
            setNotes('');
            setSelectedReview(null);
            await fetchReviews();
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <DashboardLayout sidebar={<RegulatorSidebar />}>
                <div className="p-8 flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading bye-laws reviews...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Bye-laws Review Queue</h1>
                    <p className="text-gray-600 mt-2">
                        Review and approve SACCO bye-laws submissions
                    </p>
                </div>

                {error && (
                    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-6">
                        <p className="text-danger-700">Error: {error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Review Queue */}
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold mb-4">
                            Pending Reviews ({reviews.length})
                        </h2>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                            {reviews.length === 0 ? (
                                <p className="text-gray-600 text-center py-8">
                                    No pending bye-laws reviews
                                </p>
                            ) : (
                                reviews.map((review) => (
                                    <div
                                        key={review.id}
                                        onClick={() => {
                                            setSelectedReview(review);
                                            setNotes('');
                                        }}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedReview?.id === review.id
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-primary-300'
                                            }`}
                                    >
                                        <div className="font-medium text-gray-900">
                                            {review.tenant.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Version {review.version} • Submitted {new Date(review.submittedAt).toLocaleDateString()}
                                        </div>
                                        <div className="mt-2">
                                            <span className={`px-2 py-1 text-xs rounded-full ${review.status === 'pending'
                                                    ? 'bg-warning-100 text-warning-700'
                                                    : 'bg-primary-100 text-primary-700'
                                                }`}>
                                                {review.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Review Panel */}
                    <div className="card p-6">
                        {selectedReview ? (
                            <>
                                <h2 className="text-xl font-semibold mb-4">
                                    Review Bye-laws
                                </h2>
                                <div className="mb-6">
                                    <div className="text-lg font-medium text-gray-900">
                                        {selectedReview.tenant.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Version {selectedReview.version} • Submitted {new Date(selectedReview.submittedAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Document Viewer */}
                                <div className="border rounded-lg p-4 mb-6">
                                    <h3 className="font-semibold mb-3">Bye-laws Document</h3>
                                    <a
                                        href={selectedReview.bylawDocumentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        <span>📄</span>
                                        View Document
                                        <span>→</span>
                                    </a>
                                </div>

                                {/* Review Notes */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Review Notes / Comments
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="Enter your review notes, approval comments, or rejection reasons..."
                                    />
                                </div>

                                {/* Previous Notes */}
                                {selectedReview.reviewNotes && (
                                    <div className="border rounded-lg p-4 bg-gray-50 mb-6">
                                        <h3 className="font-semibold mb-2">Previous Review Notes</h3>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {selectedReview.reviewNotes}
                                        </p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={approveByelaws}
                                        disabled={actionLoading || !notes.trim()}
                                        className="flex-1 btn btn-success px-6 py-3"
                                    >
                                        {actionLoading ? 'Processing...' : '✓ Approve Bye-laws'}
                                    </button>
                                    <button
                                        onClick={rejectByelaws}
                                        disabled={actionLoading || !notes.trim()}
                                        className="flex-1 btn btn-danger px-6 py-3"
                                    >
                                        {actionLoading ? 'Processing...' : '✗ Reject Bye-laws'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                Select a bye-laws submission to review
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
