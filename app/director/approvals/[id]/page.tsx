'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ApplicationDetail {
    id: string;
    proposedName: string;
    applicationType: string;
    primaryContactName: string;
    primaryContactEmail: string;
    primaryContactPhone: string;
    physicalAddress: string;
    status: string;
    submittedAt: string;
    updatedAt: string;
    rejectionReasons?: string;
    feeAmount: number;
    fileNumber?: string;
    certificateNumber?: string;
    certificateIssuedAt?: string;
}

interface HistoryEntry {
    id: string;
    fromStatus?: string;
    toStatus: string;
    action?: string;
    notes?: string;
    changedAt: string;
    changedBy: {
        id: string;
        name: string;
        email: string;
    };
}

export default function DirectorApprovalDetail({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [app, setApp] = useState<ApplicationDetail | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [appRes, historyRes] = await Promise.all([
                    fetch(`/api/registration/applications/${params.id}`),
                    fetch(`/api/regulator/applications/${params.id}/history`).catch(() => null)
                ]);

                if (appRes.ok) {
                    const data = await appRes.json();
                    setApp(data);
                } else {
                    setError('Application not found or access denied.');
                }

                if (historyRes && historyRes.ok) {
                    const historyData = await historyRes.json();
                    setHistory(historyData);
                }
            } catch (e: any) {
                setError(e.message || 'Failed to load application');
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params.id]);

    const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
        if (!notes.trim()) {
            alert('Please provide notes for your decision before submitting.');
            return;
        }
        const confirmMsg = decision === 'APPROVE'
            ? `Are you sure you want to grant Director-level APPROVAL to "${app?.proposedName}"? This is a high-level executive action.`
            : `Are you sure you want to REJECT "${app?.proposedName}"? This action will be logged.`;

        if (!confirm(confirmMsg)) return;

        setProcessing(true);
        try {
            const res = await fetch('/api/registration/director/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: params.id, decision, notes }),
            });

            if (res.ok) {
                alert(`Application ${decision === 'APPROVE' ? 'approved' : 'rejected'} successfully.`);
                const appRes = await fetch(`/api/registration/applications/${params.id}`);
                if (appRes.ok) setApp(await appRes.json());
                setNotes('');
                // Refresh history
                const histRes = await fetch(`/api/regulator/applications/${params.id}/history`).catch(() => null);
                if (histRes?.ok) setHistory(await histRes.json());
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to process decision.');
            }
        } catch (e: any) {
            alert(e.message || 'An unexpected error occurred.');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending_decision: 'bg-amber-100 text-amber-800 border-amber-300',
            approved: 'bg-green-100 text-green-800 border-green-300',
            rejected: 'bg-red-100 text-red-800 border-red-300',
            under_review: 'bg-blue-100 text-blue-800 border-blue-300',
            appeal_approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
        return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-300';
    };

    if (loading) return (
        <div className="p-8 flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading application details...</p>
            </div>
        </div>
    );

    if (error || !app) return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="glass-panel p-8 bg-rose-50 text-rose-700 text-center rounded-3xl">
                <p className="text-xl font-bold mb-4">{error || 'Application not found.'}</p>
                <Link href="/director/dashboard" className="btn btn-primary">← Back to Dashboard</Link>
            </div>
        </div>
    );

    const isDecisionPending = app.status === 'pending_decision' || app.status === 'PENDING_DECISION';
    const isApproved = ['approved', 'appeal_approved'].includes(app.status.toLowerCase());

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <Link href="/director/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{app.proposedName}</h1>
                    <div className="flex items-center gap-3 mt-1">
                        {app.fileNumber && <span className="text-sm font-bold text-gray-500">#{app.fileNumber}</span>}
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusBadge(app.status)}`}>
                            {app.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="p-2 bg-primary-100 text-primary-700 rounded-lg text-sm">🏛️</span>
                        Society Details
                    </h3>
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider">Application Type</dt>
                            <dd className="mt-1 font-semibold text-gray-900 capitalize">{app.applicationType.replace(/_/g, ' ')}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider">Physical Address</dt>
                            <dd className="mt-1 font-semibold text-gray-900">{app.physicalAddress}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider">Application Fee</dt>
                            <dd className="mt-1 font-semibold text-gray-900">P {app.feeAmount?.toFixed(2)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</dt>
                            <dd className="mt-1 font-semibold text-gray-900">{new Date(app.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                        </div>
                    </dl>
                </div>

                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="p-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm">👤</span>
                        Primary Contact
                    </h3>
                    <dl className="space-y-4">
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider">Name</dt>
                            <dd className="mt-1 font-semibold text-gray-900">{app.primaryContactName}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</dt>
                            <dd className="mt-1 font-semibold text-gray-900">{app.primaryContactEmail}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</dt>
                            <dd className="mt-1 font-semibold text-gray-900">{app.primaryContactPhone}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</dt>
                            <dd className="mt-1 font-semibold text-gray-900">{new Date(app.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Status History */}
            {history.length > 0 && (
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="p-2 bg-gray-100 text-gray-700 rounded-lg text-sm">📋</span>
                        Review History
                    </h3>
                    <div className="space-y-4">
                        {history.map((entry, idx) => (
                            <div key={entry.id} className="flex gap-4 relative">
                                {idx !== history.length - 1 && (
                                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-100"></div>
                                )}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 border-2 border-primary-400 flex items-center justify-center z-10">
                                    <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                                </div>
                                <div className="flex-1 pb-4">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <span className="font-bold text-gray-900 capitalize">
                                                {entry.action?.replace(/_/g, ' ') || 'Status Change'}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-2">
                                                {entry.fromStatus && `${entry.fromStatus} → `}{entry.toStatus}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-400">{new Date(entry.changedAt).toLocaleString()}</span>
                                    </div>
                                    <div className="text-sm text-gray-500">By: {entry.changedBy?.name}</div>
                                    {entry.notes && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-100">{entry.notes}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Director Decision Panel */}
            <div className="glass-panel p-8 border-t-4 border-primary-600 relative overflow-hidden">
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary-50 rounded-full blur-3xl opacity-60"></div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-3">
                        ⚖️ Director's Decision
                    </h3>
                    <p className="text-gray-500 text-sm mb-6">As Director of Cooperatives, your decision constitutes an official executive action and will be logged in the immutable audit trail.</p>

                    {isApproved ? (
                        <div className="bg-green-50 border-2 border-dashed border-green-400 rounded-2xl p-8 text-center">
                            <div className="w-20 h-20 bg-green-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl shadow-xl">✓</div>
                            <h4 className="text-2xl font-black text-green-800 mb-2">Application Approved</h4>
                            <p className="text-green-700 font-medium">This society has received Director-level approval.</p>
                            {app.certificateNumber && (
                                <div className="mt-4 p-4 bg-white rounded-xl border border-green-200 inline-block">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Registration Number</div>
                                    <div className="text-2xl font-mono font-black text-gray-900">{app.certificateNumber}</div>
                                </div>
                            )}
                        </div>
                    ) : app.status.toLowerCase() === 'rejected' ? (
                        <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-2xl p-8 text-center">
                            <div className="w-20 h-20 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl shadow-xl">✕</div>
                            <h4 className="text-2xl font-black text-red-800 mb-2">Application Rejected</h4>
                            <p className="text-red-700 font-medium">This society&apos;s registration was declined.</p>
                            {app.rejectionReasons && (
                                <div className="mt-4 p-4 bg-white rounded-xl border border-red-200 text-left">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Reason</div>
                                    <p className="text-sm text-gray-700">{app.rejectionReasons}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">
                                    Director&apos;s Official Notes <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    className="w-full rounded-2xl border border-gray-200 bg-white/70 p-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none h-32"
                                    placeholder="Provide your official rationale for the decision. This will be permanently recorded..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                {!isDecisionPending && (
                                    <p className="mt-2 text-sm text-amber-600 font-medium">
                                        ⚠️ This application is currently in <strong>{app.status.replace(/_/g, ' ')}</strong> status and may not be ready for a final decision yet.
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleDecision('APPROVE')}
                                    disabled={processing}
                                    className="btn py-4 text-lg font-black bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:scale-95"
                                >
                                    {processing ? 'Processing...' : '✅ Grant Director Approval'}
                                </button>
                                <button
                                    onClick={() => handleDecision('REJECT')}
                                    disabled={processing}
                                    className="btn py-4 text-lg font-black bg-white border-2 border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    ❌ Decline Registration
                                </button>
                            </div>
                            <p className="mt-4 text-center text-xs text-gray-400 italic">
                                * This action is irreversible and will be recorded in the national registry audit log.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
