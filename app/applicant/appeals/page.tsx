'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-hooks';
import { SocietyApplication, ApplicationStatus } from '@/src/entities/SocietyApplication';
import { AlertCircle, Send, MessageSquare, CheckCircle2 } from 'lucide-react';

export default function AppealsPage() {
    const { user } = useAuth();
    const [applications, setApplications] = useState<SocietyApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [appealNotes, setAppealNotes] = useState('');

    useEffect(() => {
        fetchApplications();
    }, [user]);

    const fetchApplications = async () => {
        try {
            const res = await fetch('/api/registration/applications');
            if (res.ok) {
                const data = await res.json();
                setApplications(data.filter((a: any) => a.applicantUserId === user?.id));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAppeal = async (applicationId: string) => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/applications/appeals/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, notes: appealNotes }),
            });
            if (res.ok) {
                await fetchApplications();
                setAppealNotes('');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-3xl" />;

    const rejectStatuses = [
        ApplicationStatus.REJECTED,
        ApplicationStatus.SECURITY_FAILED,
        ApplicationStatus.LEGAL_REJECTED,
        ApplicationStatus.APPEAL_REJECTED
    ];

    const appealableApps = applications.filter(a => rejectStatuses.includes(a.status));
    const activeAppeals = applications.filter(a => [ApplicationStatus.APPEAL_LODGED, ApplicationStatus.APPEAL_APPROVED, ApplicationStatus.APPEAL_REJECTED].includes(a.status));

    return (
        <div className="space-y-12 pb-20">
            <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Appeals</h1>
                <p className="text-gray-500 mt-2 font-medium">Manage and monitor your registration appeals.</p>
            </div>

            {/* Appealable Applications */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="text-red-500" size={24} />
                    Needs Attention
                </h2>
                {appealableApps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {appealableApps.map(app => (
                            <div key={app.id} className="bg-white rounded-3xl p-8 border border-red-100 shadow-xl shadow-red-50 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{app.proposedName}</h3>
                                        <p className="text-sm font-bold text-red-600 uppercase tracking-widest mt-1">{app.status.replace('_', ' ')}</p>
                                    </div>
                                    <div className="px-4 py-1 bg-red-50 rounded-full text-red-700 text-xs font-black">REJECTED</div>
                                </div>
                                <p className="text-sm text-gray-600 mb-8 italic">Reason: {app.rejectionReasons || 'No reason provided'}</p>

                                <div className="space-y-4">
                                    <textarea
                                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 outline-none transition-all font-medium text-sm"
                                        placeholder="Enter your appeal reasoning here..."
                                        rows={4}
                                        value={appealNotes}
                                        onChange={(e) => setAppealNotes(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleSubmitAppeal(app.id)}
                                        disabled={submitting || !appealNotes}
                                        className="w-full py-4 bg-primary-600 text-white font-black rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                        Submit Appeal
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 font-bold bg-white p-8 rounded-3xl border border-gray-100 text-center">No applications currently require appeal.</p>
                )}
            </section>

            {/* Active Appeals */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="text-primary-500" size={24} />
                    Your Appeals
                </h2>
                <div className="space-y-4">
                    {activeAppeals.map(app => (
                        <div key={app.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${app.status === ApplicationStatus.APPEAL_APPROVED ? 'bg-green-100 text-green-600' :
                                app.status === ApplicationStatus.APPEAL_REJECTED ? 'bg-red-100 text-red-600' :
                                    'bg-primary-50 text-primary-600'
                                }`}>
                                {app.status === ApplicationStatus.APPEAL_APPROVED ? <CheckCircle2 size={24} /> :
                                    app.status === ApplicationStatus.APPEAL_REJECTED ? <AlertCircle size={24} /> :
                                        <MessageSquare size={24} />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900">{app.proposedName}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{app.status.replace('_', ' ')}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">LODGED ON</p>
                                <p className="font-bold text-gray-900">{app.appealLodgedAt ? new Date(app.appealLodgedAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    ))}
                    {activeAppeals.length === 0 && (
                        <p className="text-gray-400 font-bold bg-white p-8 rounded-3xl border border-gray-100 text-center">No active appeals found.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
