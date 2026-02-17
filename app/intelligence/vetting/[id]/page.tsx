'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function VettingInterface({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [application, setApplication] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [notes, setNotes] = useState('');
    const [isCleared, setIsCleared] = useState<boolean | null>(null);

    useEffect(() => {
        async function fetchDetails() {
            try {
                const [appRes, docsRes] = await Promise.all([
                    fetch(`/api/regulator/applications/${params.id}`),
                    fetch(`/api/regulator/applications/${params.id}/documents`)
                ]);
                if (appRes.ok) setApplication(await appRes.json());
                if (docsRes.ok) setDocuments(await docsRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [params.id]);

    const handleSubmit = async () => {
        if (isCleared === null) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/registration/security-clearance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: params.id,
                    isCleared,
                    notes
                })
            });

            if (res.ok) {
                router.push('/intelligence/dashboard');
            } else {
                alert('Submission failed');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <DashboardLayout sidebar={<RegulatorSidebar />}><div className="p-8">Loading...</div></DashboardLayout>;
    if (!application) return <DashboardLayout sidebar={<RegulatorSidebar />}><div className="p-8">Application not found</div></DashboardLayout>;

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-5xl mx-auto">
                <header className="mb-8">
                    <Link href="/intelligence/dashboard" className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline mb-2 block">← Vetting Workspace</Link>
                    <h1 className="text-3xl font-bold">{application.proposedName}</h1>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full uppercase">{application.fileNumber}</span>
                        <span className="text-gray-500 text-sm italic">{application.applicationType?.replace('_', ' ')} Submission</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Security Review Form */}
                        <section className="card p-8 border-t-4 border-indigo-600 shadow-xl shadow-indigo-500/5">
                            <h2 className="text-xl font-bold mb-6">Security Vetting Report</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Vetting Status</label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setIsCleared(true)}
                                            className={`flex-1 py-4 rounded-2xl border-2 transition-all font-black flex items-center justify-center gap-2 ${isCleared === true ? 'border-success-500 bg-success-50 text-success-700 shadow-lg shadow-success-500/10' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <span className="text-xl">✅</span> Clear Society
                                        </button>
                                        <button
                                            onClick={() => setIsCleared(false)}
                                            className={`flex-1 py-4 rounded-2xl border-2 transition-all font-black flex items-center justify-center gap-2 ${isCleared === false ? 'border-danger-500 bg-danger-50 text-danger-700 shadow-lg shadow-danger-500/10' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                        >
                                            <span className="text-xl">🚩</span> Raise Red Flag
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Vetting Findings & Notes</label>
                                    <textarea
                                        className="w-full h-48 p-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:italic"
                                        placeholder="Enter background check findings, potential risks, or clearance justification..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={isCleared === null || submitting || !notes}
                                    className="w-full btn bg-gray-900 text-white hover:bg-black py-4 rounded-2xl font-black text-lg shadow-xl shadow-gray-900/20 disabled:opacity-50 transition-all transform active:scale-[0.98]"
                                >
                                    {submitting ? 'Submitting Report...' : 'Finalize Vetting Decision'}
                                </button>
                            </div>
                        </section>

                        {/* Documents */}
                        <section className="card p-6">
                            <h2 className="text-lg font-bold mb-4">Submission Documents</h2>
                            <div className="space-y-3">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📄</span>
                                            <div>
                                                <div className="text-sm font-bold capitalize">{doc.documentType?.replace('_', ' ')}</div>
                                                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{doc.fileName}</div>
                                            </div>
                                        </div>
                                        <a href={doc.fileUrl} target="_blank" className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                                            View File
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        {/* Application Summary */}
                        <section className="card p-6 border-l-4 border-indigo-500 bg-indigo-50/30">
                            <h2 className="text-lg font-bold mb-4">Case Summary</h2>
                            <div className="space-y-4 text-sm">
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">Proposed Name</span> <span className="font-black text-gray-900 leading-tight">{application.proposedName}</span></div>
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">Primary Contact</span> <span className="font-medium">{application.primaryContactName}</span></div>
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">Contact ID/Passport</span> <span className="font-mono text-xs font-bold text-indigo-700">{application.primaryContactId}</span></div>
                                <div className="pt-4 mt-4 border-t border-indigo-100">
                                    <span className="text-gray-500 block font-bold text-[10px] uppercase mb-1">Risk Profile</span>
                                    <span className="px-2 py-0.5 bg-indigo-200 text-indigo-800 text-[10px] font-black rounded-full uppercase tracking-tighter">Standard Application</span>
                                </div>
                            </div>
                        </section>

                        {/* Audit Trail (Placeholder) */}
                        <section className="card p-6">
                            <h2 className="text-lg font-bold mb-4">Workflow Progress</h2>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 bg-success-500 rounded-full mt-1.5"></div>
                                        <div className="w-0.5 h-full bg-success-200 flex-1"></div>
                                    </div>
                                    <div className="text-xs pb-4">
                                        <div className="font-bold text-gray-900">Registry Intake Complete</div>
                                        <div className="text-gray-500">{new Date(application.assignedFileNumberAt).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 bg-indigo-600 rounded-full border-4 border-indigo-100 animate-pulse"></div>
                                    </div>
                                    <div className="text-xs">
                                        <div className="font-black text-indigo-700 uppercase">Security Vetting In Progress</div>
                                        <div className="text-gray-400 mt-1 italic">Under active review...</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
