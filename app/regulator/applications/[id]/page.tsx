'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { useRouter } from 'next/navigation';

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
    rejectionReasons?: string;
    feeAmount: number;
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

interface ApplicationDocument {
    id: string;
    name: string;
    type: string;
    path: string;
    uploadedAt: string;
}

export default function ApplicationReview({ params }: { params: { id: string } }) {
    const [app, setApp] = useState<ApplicationDetail | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [notes, setNotes] = useState('');
    const router = useRouter();

    useEffect(() => {
        async function fetchData() {
            try {
                const [appRes, historyRes, docsRes] = await Promise.all([
                    fetch(`/api/regulator/applications/${params.id}`),
                    fetch(`/api/regulator/applications/${params.id}/history`),
                    fetch(`/api/regulator/applications/${params.id}/documents`)
                ]);

                if (appRes.ok) {
                    const data = await appRes.json();
                    setApp(data);
                }

                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    setHistory(historyData);
                }

                if (docsRes.ok) {
                    const docsData = await docsRes.json();
                    setDocuments(docsData);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params.id]);

    const handleAction = async (action: 'approve' | 'reject' | 'request_info') => {
        if (!confirm(`Are you sure you want to ${action.replace('_', ' ')} this application?`)) return;

        setProcessing(true);
        try {
            let res;
            if (action === 'approve') {
                res = await fetch('/api/registration/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ applicationId: params.id, notes })
                });
            } else {
                res = await fetch(`/api/regulator/applications/${params.id}/action`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action, notes })
                });
            }

            if (res.ok) {
                const data = await res.json();
                alert(action === 'approve' ? 'Application approved and registration number assigned.' : 'Action completed successfully');
                setApp(data.application || data);
                setNotes('');

                // Refresh history
                const historyRes = await fetch(`/api/regulator/applications/${params.id}/history`);
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    setHistory(historyData);
                }
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Failed to perform action');
            }
        } catch (e) {
            console.error(e);
            alert('Error performing action');
        } finally {
            setProcessing(false);
        }
    };

    const handleIssueCertificate = async () => {
        if (!confirm('Are you sure you want to issue the official registration certificate?')) return;

        setProcessing(true);
        try {
            const res = await fetch('/api/registration/certificates/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: params.id })
            });

            if (res.ok) {
                alert('Official certificate issued successfully.');
                // Refresh app data
                const appRes = await fetch(`/api/regulator/applications/${params.id}`);
                if (appRes.ok) {
                    const data = await appRes.json();
                    setApp(data);
                }
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Failed to issue certificate');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <DashboardLayout sidebar={<RegulatorSidebar />}><div className="p-8">Loading...</div></DashboardLayout>;
    if (!app) return <DashboardLayout sidebar={<RegulatorSidebar />}><div className="p-8">Application not found</div></DashboardLayout>;

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Application Review</h1>
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium uppercase tracking-wide">
                        {app.status}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Society Details</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm text-gray-500">Proposed Name</dt>
                                <dd className="font-medium text-gray-900">{app.proposedName}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Type</dt>
                                <dd className="font-medium text-gray-900 capitalize">{app.applicationType.replace('_', ' ')}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Physical Address</dt>
                                <dd className="font-medium text-gray-900">{app.physicalAddress}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Application Fee</dt>
                                <dd className="font-medium text-gray-900">P {app.feeAmount?.toFixed(2)}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="card p-6">
                        <h3 className="text-lg font-semibold mb-4 border-b pb-2">Contact Information</h3>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm text-gray-500">Primary Contact</dt>
                                <dd className="font-medium text-gray-900">{app.primaryContactName}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Email</dt>
                                <dd className="font-medium text-gray-900">{app.primaryContactEmail}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Phone</dt>
                                <dd className="font-medium text-gray-900">{app.primaryContactPhone}</dd>
                            </div>
                            <div>
                                <dt className="text-sm text-gray-500">Submitted On</dt>
                                <dd className="font-medium text-gray-900">{new Date(app.submittedAt).toLocaleDateString()}</dd>
                            </div>
                        </dl>
                    </div>
                </div>


                {/* Documents Section */}
                <div className="card p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Uploaded Documents</h3>

                    {/* Upload Form */}
                    <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 transition-colors">
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;

                            if (!fileInput.files?.[0]) {
                                alert('Please select a file');
                                return;
                            }

                            try {
                                const uploadFormData = new FormData();
                                uploadFormData.append('file', fileInput.files[0]);
                                uploadFormData.append('documentType', formData.get('documentType') as string);

                                const res = await fetch(`/api/regulator/applications/${params.id}/documents`, {
                                    method: 'POST',
                                    body: uploadFormData
                                });

                                if (res.ok) {
                                    alert('Document uploaded successfully');
                                    // Refresh documents list instead of reloading
                                    const docsRes = await fetch(`/api/regulator/applications/${params.id}/documents`);
                                    if (docsRes.ok) {
                                        const docsData = await docsRes.json();
                                        setDocuments(docsData);
                                    }
                                } else {
                                    const error = await res.json();
                                    alert(error.error || 'Upload failed');
                                }
                            } catch (err) {
                                console.error(err);
                                alert('Upload failed');
                            }
                        }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="label">Document Type</label>
                                    <select name="documentType" className="input w-full" required>
                                        <option value="constitution">Constitution</option>
                                        <option value="form_a">Form A</option>
                                        <option value="membership_list">Membership List</option>
                                        <option value="viability_report">Viability Report</option>
                                        <option value="proof_of_capital">Proof of Capital</option>
                                        <option value="appeal_letter">Appeal Letter</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="label">Select File</label>
                                    <input
                                        type="file"
                                        className="input w-full"
                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                        required
                                    />
                                </div>
                                <div>
                                    <button type="submit" className="btn btn-primary w-full">
                                        📤 Upload Document
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)</p>
                        </form>
                    </div>

                    {/* Documents List */}
                    <div className="space-y-2">
                        {documents.length === 0 ? (
                            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                                No documents uploaded yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📄</span>
                                            <div>
                                                <div className="font-medium text-sm text-gray-900">{doc.name}</div>
                                                <div className="text-xs text-gray-500 uppercase">{doc.type.replace('_', ' ')} • {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={`/api/regulator/applications/${params.id}/documents?docId=${doc.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-semibold text-primary-600 hover:text-primary-800 bg-white px-2 py-1 rounded border border-primary-200"
                                            >
                                                👁️ View
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>


                {/* Audit Trail / History */}
                <div className="card p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4">Status History</h3>
                    {history.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No history available</p>
                    ) : (
                        <div className="space-y-4">
                            {history.map((entry, idx) => (
                                <div key={entry.id} className="flex gap-4 relative">
                                    {/* Timeline line */}
                                    {idx !== history.length - 1 && (
                                        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
                                    )}

                                    {/* Timeline dot */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center z-10">
                                        <div className="w-2 h-2 rounded-full bg-primary-600"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-4">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <span className="font-semibold text-gray-900 capitalize">
                                                    {entry.action?.replace('_', ' ') || 'Status Change'}
                                                </span>
                                                {entry.fromStatus && (
                                                    <span className="text-sm text-gray-600 ml-2">
                                                        {entry.fromStatus} → {entry.toStatus}
                                                    </span>
                                                )}
                                                {!entry.fromStatus && (
                                                    <span className="text-sm text-gray-600 ml-2">
                                                        → {entry.toStatus}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">
                                                {new Date(entry.changedAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            By: {entry.changedBy.name}
                                        </div>
                                        {entry.notes && (
                                            <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700">
                                                {entry.notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="card-glass p-8 border-t-8 border-primary-600 shadow-2xl relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-100 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 font-display">
                            ⚖️ Registrar Decision Panel
                        </h3>

                        {app.status === 'approved' || app.status === 'appeal_approved' ? (
                            <div className="bg-success-50/50 border-2 border-dashed border-success-400 rounded-2xl p-8 text-center animate-fade-in mb-6">
                                <div className="w-24 h-24 bg-success-600 rounded-full mx-auto mb-6 flex items-center justify-center text-white shadow-xl shadow-success-200">
                                    <span className="text-5xl">✓</span>
                                </div>
                                <h4 className="text-2xl font-bold text-success-800 mb-2 font-display">Application Approved</h4>
                                <p className="text-success-700 font-medium mb-6">This society has been officially sanctioned and assigned a registration number.</p>

                                <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-success-200 inline-block text-left mb-8 shadow-sm">
                                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Registration Number</div>
                                    <div className="text-3xl font-mono font-black text-gray-900 tracking-tighter">{app.certificateNumber}</div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    {!app.certificateIssuedAt ? (
                                        <button
                                            onClick={handleIssueCertificate}
                                            disabled={processing}
                                            className="btn btn-primary px-8 py-4 text-lg shadow-primary-200"
                                        >
                                            🏆 {processing ? 'Issuing...' : 'Issue Official Certificate'}
                                        </button>
                                    ) : (
                                        <div className="p-4 bg-primary-600 text-white rounded-xl shadow-lg flex items-center gap-3">
                                            <span className="text-2xl">🏆</span>
                                            <div className="text-left font-bold">
                                                Certificate Issued
                                                <div className="text-xs font-normal opacity-80">{new Date(app.certificateIssuedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Registrar's Final Decision Notes</label>
                                    <textarea
                                        className="input w-full h-32 text-lg p-6 bg-white/50 backdrop-blur-sm focus:bg-white"
                                        placeholder="Add official notes for the record..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => handleAction('approve')}
                                        disabled={processing || app.status !== 'pending_decision'}
                                        className="btn bg-success-600 hover:bg-success-700 text-white py-5 text-xl font-black shadow-xl shadow-success-100 disabled:opacity-30 disabled:grayscale transition-all hover:-translate-y-1 active:scale-95"
                                    >
                                        {processing ? 'Processing...' : '✅ EXECUTE APPROVAL'}
                                    </button>
                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => handleAction('reject')}
                                            disabled={processing}
                                            className="btn bg-white border-2 border-danger-200 text-danger-700 hover:bg-danger-50 py-3 font-bold transition-all shadow-sm"
                                        >
                                            ❌ Decline Registry
                                        </button>
                                        <button
                                            onClick={() => handleAction('request_info')}
                                            disabled={processing}
                                            className="btn bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 py-3 font-bold transition-all shadow-sm"
                                        >
                                            ℹ️ Request Specification
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-6 text-center text-xs text-gray-400 italic">
                                    * Executing approval will automatically generate a unique national registration number and log this action into the immutable audit trail.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
