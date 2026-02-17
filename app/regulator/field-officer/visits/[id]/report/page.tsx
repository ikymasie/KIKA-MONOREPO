'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';
import GPSTracker from '@/components/regulator/GPSTracker';

interface Visit {
    id: string;
    tenantId: string;
    tenant: { name: string };
    purpose: string;
}

export default function SubmitReportPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [visit, setVisit] = useState<Visit | null>(null);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1);

    // Form State
    const [checklist, setChecklist] = useState({
        voluntaryMembership: false,
        democraticControl: false,
        memberEconomicParticipation: false,
        autonomyIndependence: false,
        educationTrainingInformation: false,
        cooperationAmongCooperatives: false,
        concernForCommunity: false,
        notes: '',
    });

    const [memberVerification, setMemberVerification] = useState({
        memberNumber: '',
        searchResult: null as any,
        verifiedMembers: [] as any[],
        discrepancies: [] as any[],
    });

    const [findings, setFindings] = useState({
        generalFindings: '',
        recommendations: '',
    });

    const [attachments, setAttachments] = useState<File[]>([]);

    useEffect(() => {
        async function fetchVisit() {
            try {
                const res = await fetch(`/api/regulator/field-visits?id=${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    // In a real app we'd fetch specific ID, here we filter
                    const specificVisit = data.find((v: any) => v.id === params.id);
                    setVisit(specificVisit);
                }
            } catch (error) {
                console.error('Failed to fetch visit:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchVisit();
    }, [params.id]);

    const handleVerifyMember = async () => {
        if (!memberVerification.memberNumber || !visit) return;
        try {
            const res = await fetch(`/api/regulator/verify-member?tenantId=${visit.tenantId}&memberNumber=${memberVerification.memberNumber}`);
            if (res.ok) {
                const data = await res.json();
                setMemberVerification({ ...memberVerification, searchResult: data });
            } else {
                setMemberVerification({ ...memberVerification, searchResult: { error: 'Member not found' } });
            }
        } catch (error) {
            setMemberVerification({ ...memberVerification, searchResult: { error: 'Verification failed' } });
        }
    };

    const addToVerified = () => {
        if (memberVerification.searchResult && !memberVerification.searchResult.error) {
            setMemberVerification({
                ...memberVerification,
                verifiedMembers: [...memberVerification.verifiedMembers, memberVerification.searchResult],
                searchResult: null,
                memberNumber: '',
            });
        }
    };

    const addToDiscrepancies = (issue: string) => {
        if (memberVerification.searchResult && !memberVerification.searchResult.error) {
            setMemberVerification({
                ...memberVerification,
                discrepancies: [...memberVerification.discrepancies, {
                    memberNumber: memberVerification.searchResult.memberNumber,
                    issue
                }],
                searchResult: null,
                memberNumber: '',
            });
        }
    };

    const handleSubmitReport = async () => {
        if (!visit) return;
        try {
            const res = await fetch('/api/regulator/field-reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visitId: visit.id,
                    tenantId: visit.tenantId,
                    cooperativePrinciplesChecklist: checklist,
                    memberVerificationResults: {
                        verifiedCount: memberVerification.verifiedMembers.length,
                        totalChecked: memberVerification.verifiedMembers.length + memberVerification.discrepancies.length,
                        discrepancies: memberVerification.discrepancies,
                    },
                    generalFindings: findings.generalFindings,
                    recommendations: findings.recommendations,
                    attachments: attachments.map(f => f.name), // In real app, upload files first
                }),
            });

            if (res.ok) {
                router.push('/regulator/field-officer/reports');
            }
        } catch (error) {
            console.error('Failed to submit report:', error);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!visit) return <div>Visit not found</div>;

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Submission of Field Report</h1>
                    <p className="text-gray-600">SACCO: <span className="font-semibold">{visit.tenant.name}</span> • Purpose: {visit.purpose}</p>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-4 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {s}
                            </div>
                            <span className={`text-sm font-medium ${step >= s ? 'text-primary-700' : 'text-gray-400'}`}>
                                {s === 1 ? 'Checklist' : s === 2 ? 'Verifications' : 'Findings'}
                            </span>
                            {s < 3 && <div className={`h-px w-12 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                        </div>
                    ))}
                </div>

                <div className="card p-8 bg-white shadow-xl border-white/40">
                    {/* Step 1: Cooperative Principles Checklist */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-2xl">📜</span> Adherence to Cooperative Principles
                            </h2>
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'voluntaryMembership', label: 'Voluntary and Open Membership' },
                                    { id: 'democraticControl', label: 'Democratic Member Control' },
                                    { id: 'memberEconomicParticipation', label: 'Member Economic Participation' },
                                    { id: 'autonomyIndependence', label: 'Autonomy and Independence' },
                                    { id: 'educationTrainingInformation', label: 'Education, Training, and Information' },
                                    { id: 'cooperationAmongCooperatives', label: 'Cooperation among Cooperatives' },
                                    { id: 'concernForCommunity', label: 'Concern for Community' },
                                ].map((p) => (
                                    <label key={p.id} className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            checked={(checklist as any)[p.id]}
                                            onChange={(e) => setChecklist({ ...checklist, [p.id]: e.target.checked })}
                                        />
                                        <span className="font-medium text-gray-800">{p.label}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-6">
                                <label className="label">Checklist Notes</label>
                                <textarea
                                    className="input h-24"
                                    placeholder="Add any specific notes about principle adherence..."
                                    value={checklist.notes}
                                    onChange={(e) => setChecklist({ ...checklist, notes: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <button onClick={() => setStep(2)} className="btn btn-primary px-8">Next: Member Verifications →</button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Member Verification Tool */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-2xl">👤</span> On-site Member Verification Tool
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">Search and verify random members against the digital registry to ensure records match physical documents.</p>

                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter Member Number..."
                                    className="input flex-1"
                                    value={memberVerification.memberNumber}
                                    onChange={(e) => setMemberVerification({ ...memberVerification, memberNumber: e.target.value })}
                                />
                                <button onClick={handleVerifyMember} className="btn btn-primary">Verify Member</button>
                            </div>

                            {memberVerification.searchResult && (
                                <div className={`p-6 rounded-2xl border-2 ${memberVerification.searchResult.error ? 'bg-danger-50 border-danger-100' : 'bg-primary-50 border-primary-100'} animate-in fade-in slide-in-from-top-4 duration-300`}>
                                    {memberVerification.searchResult.error ? (
                                        <p className="text-danger-700 font-bold flex items-center gap-2 mb-2">
                                            <span>❌</span> {memberVerification.searchResult.error}
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <h3 className="font-bold text-primary-900 text-lg mb-4 flex items-center gap-2">
                                                    <span>✅</span> Found Member: {memberVerification.searchResult.firstName} {memberVerification.searchResult.lastName}
                                                </h3>
                                            </div>
                                            <div>
                                                <p className="text-xs text-primary-700 font-bold uppercase tracking-wider mb-1">National ID</p>
                                                <p className="font-semibold text-gray-900">{memberVerification.searchResult.nationalId}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-primary-700 font-bold uppercase tracking-wider mb-1">KYC Status</p>
                                                <p className="font-semibold text-gray-900">{memberVerification.searchResult.kycStatus}</p>
                                            </div>
                                            <div className="col-span-2 flex gap-3 mt-4">
                                                <button onClick={addToVerified} className="btn bg-success-600 text-white hover:bg-success-700 flex-1">Record as Valid</button>
                                                <button onClick={() => addToDiscrepancies('Data Mismatch')} className="btn bg-danger-600 text-white hover:bg-danger-700 flex-1">Flag Discrepancy</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <div className="card p-4 bg-gray-50/50">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="text-success-600">✓</span> Valid Records ({memberVerification.verifiedMembers.length})
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {memberVerification.verifiedMembers.map((m, i) => (
                                            <div key={i} className="text-sm p-3 bg-white rounded-lg border border-gray-100 shadow-sm flex justify-between">
                                                <span>{m.firstName} {m.lastName}</span>
                                                <span className="text-gray-400">#{m.memberNumber}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="card p-4 bg-gray-50/50">
                                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                        <span className="text-danger-600">⚠</span> Flags ({memberVerification.discrepancies.length})
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {memberVerification.discrepancies.map((d, i) => (
                                            <div key={i} className="text-sm p-3 bg-danger-50 rounded-lg border border-danger-100 shadow-sm flex justify-between">
                                                <span className="text-danger-800 font-medium">#{d.memberNumber}</span>
                                                <span className="text-danger-600 italic">{d.issue}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(1)} className="btn btn-secondary">← Back to Checklist</button>
                                <button onClick={() => setStep(3)} className="btn btn-primary px-8">Next: Findings & Recommendations →</button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Findings & Recommendations */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="text-2xl">✍️</span> Final Findings & Recommendations
                            </h2>

                            <GPSTracker visitId={visit.id} />

                            <div className="form-group">
                                <label className="label">General Visit Findings</label>
                                <textarea
                                    className="input h-32"
                                    placeholder="Summarize the core findings of your visit..."
                                    value={findings.generalFindings}
                                    onChange={(e) => setFindings({ ...findings, generalFindings: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="label">Official Recommendations</label>
                                <textarea
                                    className="input h-32"
                                    placeholder="List the mandatory actions and recommendations for the SACCO..."
                                    value={findings.recommendations}
                                    onChange={(e) => setFindings({ ...findings, recommendations: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="label">Document Scanning & Attachments</label>
                                <div className="mt-2 flex flex-wrap gap-4">
                                    {attachments.map((file: File, idx: number) => (
                                        <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                                            <img src={URL.createObjectURL(file)} alt="attachment" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setAttachments(attachments.filter((_: File, i: number) => i !== idx))}
                                                className="absolute top-1 right-1 bg-danger-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all text-gray-400 hover:text-primary-600">
                                        <span className="text-2xl">📸</span>
                                        <span className="text-[10px] font-bold uppercase mt-1">Scan/Upload</span>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files) {
                                                    setAttachments([...attachments, ...Array.from(e.target.files)]);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">Use your device camera to scan documents or upload field photos.</p>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button onClick={() => setStep(2)} className="btn btn-secondary">← Back to Verifications</button>
                                <button onClick={handleSubmitReport} className="btn bg-primary-600 text-white hover:bg-primary-700 px-12 font-bold shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1">Submit Official Report</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
