'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface SecurityScreening {
    id: string;
    applicationId: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'cleared' | 'failed' | 'flagged';
    notes: string;
    checks: {
        criminalRecordMatched: boolean;
        sanctionsListMatched: boolean;
        adverseMediaFound: boolean;
        pepStatusConfirmed: boolean;
        sourceOfWealthVerified: boolean;
    };
    riskFlags: Array<{
        id: string;
        type: string;
        description: string;
        isResolved: boolean;
    }>;
}

export default function ScreeningDetails() {
    const { id } = useParams();
    const router = useRouter();
    const [application, setApplication] = useState<any>(null);
    const [screening, setScreening] = useState<SecurityScreening | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [notes, setNotes] = useState('');
    const [isCleared, setIsCleared] = useState(true);
    const [riskLevel, setRiskLevel] = useState('low');
    const [newFlagType, setNewFlagType] = useState('identity');
    const [newFlagDesc, setNewFlagDesc] = useState('');

    useEffect(() => {
        async function fetchData() {
            try {
                const [appRes, screeningRes] = await Promise.all([
                    fetch(`/api/registration/applications/${id}`),
                    fetch(`/api/registration/security/screening?applicationId=${id}`)
                ]);

                if (appRes.ok) setApplication(await appRes.json());
                if (screeningRes.ok) {
                    const data = await screeningRes.json();
                    if (data) {
                        setScreening(data);
                        setNotes(data.notes || '');
                        setRiskLevel(data.riskLevel || 'low');
                        setIsCleared(data.status === 'cleared');
                    }
                }
            } catch (error) {
                console.error('Fetch screening detail error:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handleAddFlag = async () => {
        if (!newFlagDesc) return;
        try {
            const res = await fetch('/api/registration/security/screening', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    screeningId: screening?.id,
                    type: newFlagType,
                    description: newFlagDesc,
                    action: 'add-risk-flag'
                })
            });
            if (res.ok) {
                // Refresh screening
                const updatedScreeningRes = await fetch(`/api/registration/security/screening?applicationId=${id}`);
                setScreening(await updatedScreeningRes.json());
                setNewFlagDesc('');
            }
        } catch (error) {
            console.error('Add flag error:', error);
        }
    };

    const handleResolveFlag = async (flagId: string) => {
        try {
            const res = await fetch('/api/registration/security/screening', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    flagId,
                    action: 'resolve-risk-flag'
                })
            });
            if (res.ok) {
                // Refresh screening
                const updatedScreeningRes = await fetch(`/api/registration/security/screening?applicationId=${id}`);
                setScreening(await updatedScreeningRes.json());
            }
        } catch (error) {
            console.error('Resolve flag error:', error);
        }
    };

    const handleSubmitDecision = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/registration/security/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: id,
                    isCleared,
                    notes,
                    riskLevel
                })
            });
            if (res.ok) {
                router.push('/intelligence/dashboard');
            }
        } catch (error) {
            console.error('Submit decision error:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        </DashboardLayout>
    );

    if (!application) return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 text-center">Application not found.</div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <button onClick={() => router.back()} className="text-gray-400 hover:text-indigo-600 font-bold text-sm flex items-center gap-1">
                                <span>←</span> Back to Dashboard
                            </button>
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Security Screening</h1>
                        <p className="text-gray-500 font-medium">Ref: {application.fileNumber} • {application.proposedName}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            disabled={saving}
                            onClick={handleSubmitDecision}
                            className={`px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${isCleared
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                    : 'bg-danger-600 text-white hover:bg-danger-700 shadow-danger-200'
                                }`}
                        >
                            {saving ? 'Processing...' : (isCleared ? 'Complete Clearance' : 'Submit Rejection')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Background Check & Notes */}
                    <div className="lg:col-span-2 space-y-8">
                        <section className="card p-8 border-none shadow-xl shadow-indigo-100/30">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-lg">🛡️</span>
                                Background Check Status
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: 'Criminal Database Check', status: 'Passed', icon: '⚖️' },
                                    { label: 'Sanctions List Vetting', status: 'Passed', icon: '🌍' },
                                    { label: 'Adverse Media Analysis', status: 'No Findings', icon: '📰' },
                                    { label: 'PEP / Political Exposure', status: 'Negative', icon: '👤' },
                                    { label: 'Source of Wealth Verification', status: 'Verified', icon: '💰' },
                                    { label: 'Identity Authentication', status: 'Authentic', icon: '🆔' },
                                ].map((check, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{check.icon}</span>
                                            <span className="text-sm font-bold text-gray-700">{check.label}</span>
                                        </div>
                                        <span className="px-3 py-1 bg-white text-success-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-success-100 shadow-sm">
                                            {check.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="card p-8 border-none shadow-xl shadow-indigo-100/30">
                            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-lg">📝</span>
                                Intelligence & Investigation Notes
                            </h2>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter detailed findings from security screening and background checks..."
                                className="w-full h-48 p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-gray-700"
                            />
                        </section>
                    </div>

                    {/* Right Column: Risk Management & Decision */}
                    <div className="space-y-8">
                        <section className="card p-8 border-none shadow-xl shadow-indigo-100/30 bg-gradient-to-br from-white to-indigo-50/20">
                            <h2 className="text-xl font-black mb-6">Decision Parameters</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Clearance Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setIsCleared(true)}
                                            className={`py-3 rounded-xl font-bold transition-all border ${isCleared ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'}`}
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => setIsCleared(false)}
                                            className={`py-3 rounded-xl font-bold transition-all border ${!isCleared ? 'bg-danger-600 text-white border-danger-600 shadow-lg shadow-danger-100' : 'bg-white text-gray-400 border-gray-100 hover:border-danger-200'}`}
                                        >
                                            Fail
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2 block">Assessed Risk Level</label>
                                    <select
                                        value={riskLevel}
                                        onChange={(e) => setRiskLevel(e.target.value)}
                                        className="w-full p-3 bg-white border border-gray-100 rounded-xl font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    >
                                        <option value="low">Low Risk</option>
                                        <option value="medium">Medium Risk</option>
                                        <option value="high">High Risk</option>
                                        <option value="critical">Critical Risk</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="card p-8 border-none shadow-xl shadow-indigo-100/30">
                            <h2 className="text-xl font-black mb-6 flex items-center justify-between">
                                Risk Flags
                                <span className="px-3 py-1 bg-danger-50 text-danger-600 rounded-full text-[10px] uppercase font-black tracking-widest">
                                    {screening?.riskFlags.length || 0} Open
                                </span>
                            </h2>

                            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                {screening?.riskFlags.map((flag) => (
                                    <div key={flag.id} className={`p-4 rounded-2xl border ${flag.isResolved ? 'bg-gray-50 border-gray-100 grayscale' : 'bg-danger-50/50 border-danger-100 shadow-sm'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-tight text-danger-700">{flag.type}</span>
                                            {!flag.isResolved && (
                                                <button
                                                    onClick={() => handleResolveFlag(flag.id)}
                                                    className="text-[10px] font-black uppercase tracking-tight text-indigo-600 hover:text-indigo-800"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-gray-700 leading-tight">{flag.description}</p>
                                    </div>
                                ))}
                                {(!screening?.riskFlags || screening.riskFlags.length === 0) && (
                                    <div className="text-center py-8 text-gray-400 italic text-sm">No risk flags identified.</div>
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3 block">Raise New Flag</label>
                                <select
                                    value={newFlagType}
                                    onChange={(e) => setNewFlagType(e.target.value)}
                                    className="w-full mb-2 p-2 bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                >
                                    <option value="identity">Identity Conflict</option>
                                    <option value="financial">Financial Irregularity</option>
                                    <option value="political">Political Linkage</option>
                                    <option value="reputational">Reputational Issue</option>
                                    <option value="other">Other Concern</option>
                                </select>
                                <textarea
                                    value={newFlagDesc}
                                    onChange={(e) => setNewFlagDesc(e.target.value)}
                                    placeholder="Flag description..."
                                    className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm mb-3 focus:outline-none"
                                />
                                <button
                                    onClick={handleAddFlag}
                                    className="w-full py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all"
                                >
                                    Record Risk Flag
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
