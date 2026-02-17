'use client';

import { useEffect, useState } from 'react';

export default function MinisterApprovals() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<any>(null);
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function fetchApps() {
            try {
                const res = await fetch('/api/registration/applications?status=pending_decision');
                if (res.ok) {
                    const data = await res.json();
                    setApplications(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchApps();
    }, []);

    const handleApprove = async () => {
        if (!selectedApp) return;

        setProcessing(true);
        try {
            const res = await fetch('/api/registration/minister/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: selectedApp.id,
                    notes: notes || 'Ministerial approval granted.'
                })
            });

            if (res.ok) {
                setApplications(applications.filter(a => a.id !== selectedApp.id));
                setSelectedApp(null);
                setNotes('');
                alert('Application approved successfully');
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('A network error occurred.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-900 tracking-tight">
                    Final Authority Approvals
                </h1>
                <p className="text-gray-500 mt-2 text-lg font-medium">Providing final ministerial sign-off for critical society registrations.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pending Queue */}
                <div className="lg:col-span-1 glass-panel p-6 flex flex-col h-[700px] border-purple-100/50">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <span className="p-2 bg-purple-100 text-purple-700 rounded-xl text-sm">✍️</span>
                        Approval Queue
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse"></div>
                            ))
                        ) : applications.length === 0 ? (
                            <div className="text-center py-20 italic text-gray-400">No applications pending final approval</div>
                        ) : (
                            applications.map(app => (
                                <button
                                    key={app.id}
                                    onClick={() => setSelectedApp(app)}
                                    className={`w-full text-left p-5 rounded-2xl transition-all border-2 group ${selectedApp?.id === app.id
                                        ? 'bg-purple-50 border-purple-500 shadow-xl shadow-purple-500/10'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-purple-200'
                                        }`}
                                >
                                    <div className="font-black text-gray-900 mb-1 group-hover:text-purple-700 transition-colors">{app.proposedName}</div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <span>{app.applicationType.replace('_', ' ')}</span>
                                        <span className="text-purple-600 font-black">REVIEW</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Review Panel */}
                <div className="lg:col-span-2 glass-panel p-10 min-h-[700px] flex flex-col shadow-2xl border-purple-100/50">
                    {selectedApp ? (
                        <div className="flex flex-col h-full space-y-8">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedApp.proposedName}</h2>
                                    <p className="text-sm font-bold text-gray-400 mt-1 italic">Reference: {selectedApp.fileNumber || 'N/A'}</p>
                                </div>
                                <div className="px-6 py-2 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-black text-xs">
                                    VERIFIED STAGE
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Applicant</div>
                                    <div className="text-sm font-bold text-gray-900">{selectedApp.primaryContactName}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Type</div>
                                    <div className="text-sm font-bold text-gray-900 uppercase">{selectedApp.applicationType.replace('_', ' ')}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Submitted</div>
                                    <div className="text-sm font-bold text-gray-900">{new Date(selectedApp.submittedAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-indigo-600 pl-3">Compliance Track</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">✓</div>
                                        <div className="text-sm font-bold text-gray-700">Security Cleared</div>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">✓</div>
                                        <div className="text-sm font-bold text-gray-700">Legal Review Complete</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Final Ministerial Directive</label>
                                <textarea
                                    className="flex-1 p-6 bg-white rounded-3xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 transition-all resize-none text-gray-700 font-medium text-lg shadow-inner"
                                    placeholder="Provide any specific directives or conditions for this registration approval..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="pt-8 border-t border-gray-100 flex gap-4">
                                <button
                                    onClick={() => setSelectedApp(null)}
                                    className="px-8 py-5 border-2 border-gray-200 text-gray-500 rounded-2xl font-black hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={processing}
                                    onClick={handleApprove}
                                    className="flex-1 py-5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-2xl font-black transition-all hover:-translate-y-1 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? 'Signing...' : 'Confer Official Approval'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                            <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner grayscale opacity-50">✍️</div>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Pending Executive Sign-off</h3>
                            <p className="text-gray-400 max-w-sm mt-4 font-medium leading-relaxed">
                                Review verified society applications and provide the final authority signature to enable the issuance of the Certificate of Registration.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
