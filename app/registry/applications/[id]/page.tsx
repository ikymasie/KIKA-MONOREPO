'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplicationReview({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [application, setApplication] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [notes, setNotes] = useState('');

    // Assignment state
    const [assignmentRole, setAssignmentRole] = useState<'intelligence' | 'legal' | null>(null);
    const [officers, setOfficers] = useState<any[]>([]);
    const [assignedOfficerId, setAssignedOfficerId] = useState('');
    const [assignmentNotes, setAssignmentNotes] = useState('');

    // Communication Log state
    const [communications, setCommunications] = useState<any[]>([]);
    const [commType, setCommType] = useState('call');
    const [commContent, setCommContent] = useState('');
    const [sendingComm, setSendingComm] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [appRes, docsRes, usersRes] = await Promise.all([
                    fetch(`/api/regulator/applications/${params.id}`),
                    fetch(`/api/regulator/applications/${params.id}/documents`),
                    fetch('/api/regulator/users')
                ]);

                if (appRes.ok) setApplication(await appRes.json());
                if (docsRes.ok) setDocuments(await docsRes.json());
                if (usersRes.ok) setOfficers(await usersRes.json());

                // Fetch communications
                const commRes = await fetch(`/api/registration/applications/${params.id}/communications`);
                if (commRes.ok) setCommunications(await commRes.json());
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params.id]);

    const handleVerifyDoc = async (docId: string, isVerified: boolean) => {
        setDocuments(docs => docs.map(d => d.id === docId ? { ...d, isVerified } : d));
    };

    const handleAssign = async () => {
        if (!assignmentRole || !assignedOfficerId) return;
        setVerifying(true);
        try {
            const res = await fetch('/api/registration/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: params.id,
                    officerId: assignedOfficerId,
                    role: assignmentRole,
                    notes: assignmentNotes
                })
            });

            if (res.ok) {
                router.push('/registry/dashboard');
            } else {
                alert('Assignment failed');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setVerifying(false);
        }
    };

    const handleCompleteReview = async (isIncomplete: boolean) => {
        setVerifying(true);
        try {
            const documentChecks = documents.map(d => ({
                documentId: d.id,
                isVerified: !!d.isVerified
            }));

            const res = await fetch('/api/registration/completeness-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: params.id,
                    isIncomplete,
                    notes,
                    documentChecks
                })
            });

            if (res.ok) {
                if (isIncomplete) {
                    router.push('/registry/dashboard');
                } else {
                    // Refresh to show assignment section
                    const updatedApp = await res.json();
                    setApplication(updatedApp);
                }
            } else {
                alert('Action failed');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setVerifying(false);
        }
    };

    const handleLogCommunication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commContent) return;
        setSendingComm(true);
        try {
            const res = await fetch(`/api/registration/applications/${params.id}/communications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: commType,
                    direction: 'outbound',
                    content: commContent,
                    subject: `Communication regarding ${application.proposedName}`
                })
            });

            if (res.ok) {
                const newComm = await res.json();
                setCommunications([newComm, ...communications]);
                setCommContent('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSendingComm(false);
        }
    };

    if (loading) return <DashboardLayout sidebar={<RegulatorSidebar />}><div className="p-8">Loading...</div></DashboardLayout>;
    if (!application) return <DashboardLayout sidebar={<RegulatorSidebar />}><div className="p-8">Application not found</div></DashboardLayout>;

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-6xl mx-auto">
                <header className="flex justify-between items-start mb-8">
                    <div>
                        <Link href="/registry/dashboard" className="text-sm text-primary-600 hover:underline mb-2 block font-bold uppercase tracking-wider">← Registry Workspace</Link>
                        <h1 className="text-3xl font-bold">{application.proposedName}</h1>
                        <p className="text-gray-600">Reviewing completeness for {application.applicationType?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex gap-3">
                        {application.status === 'submitted' && (
                            <>
                                <button
                                    onClick={() => handleCompleteReview(true)}
                                    className="btn bg-danger-50 text-danger-600 border border-danger-200 hover:bg-danger-100 px-6 py-2 rounded-xl font-bold transition-all"
                                    disabled={verifying}
                                >
                                    Mark Incomplete
                                </button>
                                <button
                                    onClick={() => handleCompleteReview(false)}
                                    className="btn btn-primary px-8 py-2 rounded-xl shadow-lg shadow-primary-500/30 font-bold transition-all"
                                    disabled={verifying || documents.some(d => !d.isVerified)}
                                >
                                    Verify & Proceed
                                </button>
                            </>
                        )}
                        {application.status === 'under_review' && (
                            <span className="px-4 py-2 bg-success-50 text-success-700 font-bold rounded-xl border border-success-200">
                                ✅ Intake Verified
                            </span>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Document Checklist */}
                        <section className="card p-6">
                            <h2 className="text-xl font-bold mb-4">Document Completeness Checklist</h2>
                            <div className="space-y-4">
                                {documents.length === 0 ? (
                                    <p className="text-gray-500 italic">No documents uploaded for this application.</p>
                                ) : (
                                    documents.map((doc) => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="text-2xl">📄</div>
                                                <div>
                                                    <div className="font-semibold capitalize">{doc.documentType?.replace('_', ' ')}</div>
                                                    <a href={doc.fileUrl} target="_blank" className="text-xs text-primary-600 hover:underline">{doc.fileName}</a>
                                                </div>
                                            </div>
                                            {application.status === 'submitted' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleVerifyDoc(doc.id, false)}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${doc.isVerified === false ? 'bg-danger-500 text-white shadow-lg shadow-danger-500/20' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerifyDoc(doc.id, true)}
                                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${doc.isVerified === true ? 'bg-success-500 text-white shadow-lg shadow-success-500/20' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'}`}
                                                    >
                                                        Verify
                                                    </button>
                                                </div>
                                            )}
                                            {application.status !== 'submitted' && doc.isVerified && (
                                                <span className="text-success-600 font-bold text-xs uppercase tracking-widest">Verified ✓</span>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Notes */}
                        {application.status === 'submitted' && (
                            <section className="card p-6">
                                <h2 className="text-xl font-bold mb-4">Registry Notes / Rejection Reasons</h2>
                                <textarea
                                    className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="Enter details if the application is incomplete..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </section>
                        )}

                        {/* Assignment Interface */}
                        {application.status === 'under_review' && (
                            <section className="card p-6 border-t-4 border-indigo-500 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h2 className="text-xl font-bold mb-4">Workflow Assignment</h2>
                                <p className="text-sm text-gray-600 mb-6 font-medium">Assign this application to the next review stage (Intelligence or Legal).</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Target Role</label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => { setAssignmentRole('intelligence'); setAssignedOfficerId(''); }}
                                                className={`flex-1 py-4 rounded-xl border-2 transition-all font-bold ${assignmentRole === 'intelligence' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-500/10' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                            >
                                                Intelligence
                                            </button>
                                            <button
                                                onClick={() => { setAssignmentRole('legal'); setAssignedOfficerId(''); }}
                                                className={`flex-1 py-4 rounded-xl border-2 transition-all font-bold ${assignmentRole === 'legal' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-lg shadow-indigo-500/10' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}`}
                                            >
                                                Legal Review
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Assign to Officer</label>
                                        <select
                                            className="w-full p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white transition-all font-medium"
                                            value={assignedOfficerId}
                                            onChange={(e) => setAssignedOfficerId(e.target.value)}
                                        >
                                            <option value="">Select an officer...</option>
                                            {officers.filter((o: any) => {
                                                if (assignmentRole === 'intelligence') return o.role === 'intelligence_liaison';
                                                if (assignmentRole === 'legal') return o.role === 'legal_officer';
                                                return false;
                                            }).map((o: any) => (
                                                <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Assignment Rationale (Internal Notes)</label>
                                    <textarea
                                        className="w-full h-24 p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        placeholder="Explain why this officer was chosen or any special instructions..."
                                        value={assignmentNotes}
                                        onChange={(e) => setAssignmentNotes(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={handleAssign}
                                    disabled={!assignmentRole || !assignedOfficerId || verifying}
                                    className="w-full mt-8 btn bg-indigo-600 text-white hover:bg-indigo-700 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 disabled:opacity-50 transition-all transform active:scale-[0.98]"
                                >
                                    {verifying ? 'Processing...' : 'Confirm Assignment'}
                                </button>
                            </section>
                        )}
                    </div>

                    <div className="space-y-8">
                        {/* File Tracking */}
                        <section className="card p-6 border-l-4 border-indigo-400">
                            <h2 className="text-lg font-bold mb-4">File Tracking</h2>
                            <div className="space-y-3 text-sm">
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">File Number</span> <span className="font-mono text-indigo-700 font-bold">{application.fileNumber || 'Pending Assignment'}</span></div>
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">Submitted Date</span> {new Date(application.submittedAt).toLocaleDateString()}</div>
                                <div className="pt-2 border-t border-gray-100">
                                    <span className="text-gray-500 block font-bold text-[10px] uppercase">Current Status</span>
                                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">{application.status?.replace('_', ' ')}</span>
                                </div>
                            </div>
                        </section>

                        {/* Applicant Info */}
                        <section className="card p-6">
                            <h2 className="text-lg font-bold mb-4">Applicant Workspace</h2>
                            <div className="space-y-4 text-sm">
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">Contact Name</span> <span className="font-medium">{application.primaryContactName}</span></div>
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">Email</span> <span className="font-medium">{application.primaryContactEmail}</span></div>
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">Phone</span> <span className="font-medium">{application.primaryContactPhone}</span></div>
                                <div><span className="text-gray-500 block font-bold text-[10px] uppercase">Physical Address</span> <span className="font-medium text-gray-600">{application.physicalAddress}</span></div>
                            </div>
                        </section>

                        {/* Communication Log */}
                        <section className="card p-6 border-t-4 border-amber-500">
                            <h2 className="text-xl font-bold mb-4">Direct Communication Log</h2>

                            <form onSubmit={handleLogCommunication} className="mb-6 space-y-3">
                                <div className="flex gap-2">
                                    <select
                                        className="p-2 text-sm rounded-lg border border-gray-200 outline-none"
                                        value={commType}
                                        onChange={(e) => setCommType(e.target.value)}
                                    >
                                        <option value="call">Phone Call</option>
                                        <option value="email">Email</option>
                                        <option value="sms">SMS</option>
                                        <option value="in_person">In Person</option>
                                        <option value="whatsapp">WhatsApp</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={sendingComm || !commContent}
                                        className="btn btn-primary px-4 py-2 text-xs rounded-lg disabled:opacity-50"
                                    >
                                        {sendingComm ? 'Logging...' : 'Log Communication'}
                                    </button>
                                </div>
                                <textarea
                                    className="w-full p-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 outline-none h-20"
                                    placeholder="Summarize the conversation with the applicant..."
                                    value={commContent}
                                    onChange={(e) => setCommContent(e.target.value)}
                                />
                            </form>

                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {communications.length === 0 ? (
                                    <p className="text-center text-gray-500 text-sm italic py-4">No communication recorded yet.</p>
                                ) : (
                                    communications.map((comm: any) => (
                                        <div key={comm.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${comm.type === 'email' ? 'bg-blue-100 text-blue-700' :
                                                    comm.type === 'call' ? 'bg-green-100 text-green-700' :
                                                        'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {comm.type}
                                                </span>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(comm.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 line-clamp-3 hover:line-clamp-none transition-all cursor-default">
                                                {comm.content}
                                            </p>
                                            <div className="mt-2 text-[10px] text-gray-500">
                                                Recorded by: {comm.recordedBy?.firstName} {comm.recordedBy?.lastName}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
