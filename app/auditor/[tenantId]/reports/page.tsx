'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface AuditReport {
    id: string;
    fileName: string;
    fileUrl: string;
    status: string;
    submittedAt: string | null;
}

export default function SubmitReportPage() {
    const params = useParams();
    const router = useRouter();
    const requestId = params.tenantId as string;

    const [report, setReport] = useState<AuditReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [tenantInfo, setTenantInfo] = useState<{ name: string } | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const reqRes = await fetch('/api/external-auditor/access-request');
                if (reqRes.ok) {
                    const requests = await reqRes.json();
                    const currentReq = requests.find((r: any) => r.id === requestId);
                    if (currentReq) {
                        setTenantInfo({ name: currentReq.tenant.name });

                        const reportRes = await fetch(`/api/external-auditor/reports/submit?requestId=${requestId}`);
                        if (reportRes.ok) setReport(await reportRes.json());
                    }
                }
            } catch (e) {
                console.error('Error fetching audit report:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [requestId]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);

        const mockUrl = `https://storage.kika.com/audits/${requestId}/final-report-${Date.now()}.pdf`;
        const fileName = (e.currentTarget.elements.namedItem('reportName') as HTMLInputElement).value;

        try {
            const res = await fetch('/api/external-auditor/reports/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId,
                    fileName,
                    fileUrl: mockUrl
                }),
            });

            if (res.ok) {
                alert('Audit report submitted successfully!');
                setReport(await res.json());
                (e.target as HTMLFormElement).reset();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to submit report');
            }
        } catch (e) {
            console.error('Error submitting report:', e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Loading report status...</div>;
    if (!tenantInfo) return <div className="p-12 text-center text-danger-600 font-bold">Audit engagement not found or access expired.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Submit Final Audit Report</h1>
                    <p className="text-gray-600">Organization: {tenantInfo.name}</p>
                </div>
                <button onClick={() => router.push(`/auditor/${requestId}/records`)} className="btn btn-outline">
                    ← Back to Records
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Status Card */}
                <div className="glass-panel p-8 flex flex-col items-center justify-center text-center">
                    <div className={`text-6xl mb-4 ${report?.status === 'submitted' ? 'animate-bounce' : ''}`}>
                        {report?.status === 'submitted' ? '✅' : '📋'}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {report?.status === 'submitted' ? 'Report Submitted' : 'Final Report Required'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {report?.status === 'submitted'
                            ? `The final audit report was submitted on ${new Date(report.submittedAt!).toLocaleString()}.`
                            : 'Upload and submit the final audit report to complete this engagement.'}
                    </p>
                    {report?.status === 'submitted' && (
                        <a href={report.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline border-emerald-200">
                            View Submitted Report
                        </a>
                    )}
                </div>

                {/* Submission Form */}
                <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold mb-6">Submission Form</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Report Name / Reference</label>
                            <input
                                type="text"
                                name="reportName"
                                className="input w-full"
                                placeholder="e.g. Annual Audit Report 2025 - Final.pdf"
                                required
                            />
                        </div>
                        <div className="p-12 border-2 border-dashed border-gray-200 rounded-2xl text-center hover:border-emerald-500 transition-colors cursor-pointer group">
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📄</div>
                            <div className="text-sm font-bold text-gray-700">Select Final Report File</div>
                            <div className="text-xs text-gray-500 mt-2">Only signed PDF files are accepted.</div>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-sm text-amber-800 italic">
                            <span>⚠️</span>
                            <span>Submission of the final report is a significant event. Please ensure all working papers are complete before submitting.</span>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full py-4 text-lg shadow-emerald-200"
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Final Audit Report'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
