'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-hooks';
import { SocietyApplication, ApplicationStatus } from '@/src/entities/SocietyApplication';
import {
    MessageSquare,
    ArrowLeft,
    Send,
    CheckCircle2,
    AlertCircle,
    History
} from 'lucide-react';
import Link from 'next/link';

export default function CooperativeAppealsPage() {
    const { user } = useAuth();
    const [rejectedApplications, setRejectedApplications] = useState<SocietyApplication[]>([]);
    const [activeAppeals, setActiveAppeals] = useState<SocietyApplication[]>([]);
    const [fetching, setFetching] = useState(true);
    const [appealNotes, setAppealNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetch('/api/applications/list')
                .then(res => res.json())
                .then(data => {
                    setRejectedApplications(data.filter((app: any) =>
                        [ApplicationStatus.REJECTED, ApplicationStatus.SECURITY_FAILED, ApplicationStatus.LEGAL_REJECTED].includes(app.status)
                    ));
                    setActiveAppeals(data.filter((app: any) =>
                        [ApplicationStatus.APPEAL_LODGED, ApplicationStatus.APPEAL_APPROVED, ApplicationStatus.APPEAL_REJECTED].includes(app.status)
                    ));
                    setFetching(false);
                })
                .catch(err => {
                    console.error(err);
                    setFetching(false);
                });
        }
    }, [user]);

    const handleSubmitAppeal = async (applicationId: string) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/applications/appeals/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, notes: appealNotes }),
            });

            if (res.ok) {
                // Refresh data
                window.location.reload();
            }
        } catch (error) {
            console.error('Error submitting appeal:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <header className="flex flex-col gap-6">
                <Link href="/cooperative" className="flex items-center gap-2 text-slate-400 font-bold hover:text-primary-600 transition-colors w-fit">
                    <ArrowLeft size={20} />
                    Back to Portal
                </Link>
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-8">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                        <MessageSquare size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Appeals Center</h1>
                        <p className="text-slate-500 font-medium">Lodge and track appeals for rejected cooperative applications.</p>
                    </div>
                </div>
            </header>

            {/* Applications requiring appeal */}
            <section className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 px-2">
                    <AlertCircle className="text-red-500" size={24} />
                    Pending Rejections
                </h2>

                {rejectedApplications.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                        {rejectedApplications.map(app => (
                            <div key={app.id} className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm border-l-8 border-l-red-500">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900">{app.proposedName}</h3>
                                        <p className="text-xs font-black text-red-600 uppercase tracking-widest mt-1">{app.status.replace('_', ' ')}</p>
                                    </div>
                                    <div className="px-4 py-1 bg-red-50 rounded-full text-red-700 text-[10px] font-black uppercase tracking-widest">Awaiting Appeal</div>
                                </div>
                                <p className="text-slate-500 font-medium mb-10 italic bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    Reason for rejection: <span className="text-slate-900 font-bold not-italic ml-1">{app.rejectionReasons || 'No specific reason provided.'}</span>
                                </p>

                                <div className="space-y-4">
                                    <textarea
                                        className="w-full p-6 bg-white border-2 border-slate-100 rounded-[2rem] focus:border-primary-500 outline-none transition-all font-bold text-slate-700 h-40"
                                        placeholder="Detail your grounds for appeal and any corrective actions taken..."
                                        value={appealNotes}
                                        onChange={(e) => setAppealNotes(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleSubmitAppeal(app.id)}
                                        disabled={submitting || !appealNotes}
                                        className="w-full py-5 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-100 hover:bg-primary-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                        Lodge Formal Appeal
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <p className="text-slate-400 font-bold italic">No applications currently require appeal.</p>
                    </div>
                )}
            </section>

            {/* Active Appeals Status */}
            <section className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 px-2">
                    <History className="text-primary-500" size={24} />
                    Appeals History
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeAppeals.map(app => (
                        <div key={app.id} className="bg-white rounded-[2rem] p-8 border border-slate-50 shadow-sm flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${app.status === ApplicationStatus.APPEAL_APPROVED ? 'bg-green-100 text-green-600' :
                                    app.status === ApplicationStatus.APPEAL_REJECTED ? 'bg-red-100 text-red-600' :
                                        'bg-slate-100 text-slate-400'
                                }`}>
                                {app.status === ApplicationStatus.APPEAL_APPROVED ? <CheckCircle2 size={28} /> :
                                    app.status === ApplicationStatus.APPEAL_REJECTED ? <AlertCircle size={28} /> :
                                        <History size={28} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-slate-900">{app.proposedName}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</p>
                                    <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${app.status === ApplicationStatus.APPEAL_APPROVED ? 'text-green-600' :
                                            app.status === ApplicationStatus.APPEAL_REJECTED ? 'text-red-600' :
                                                'text-primary-600'
                                        }`}>{app.status.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Lodged</p>
                                <p className="font-black text-slate-700 text-sm">{app.appealLodgedAt ? new Date(app.appealLodgedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    ))}
                    {activeAppeals.length === 0 && (
                        <div className="md:col-span-2 p-12 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <p className="text-slate-400 font-bold italic">No active or past appeals found.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
