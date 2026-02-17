'use client';

import { useEffect, useState } from 'react';

export default function AppealsReview() {
    const [appeals, setAppeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        async function fetchAppeals() {
            try {
                const res = await fetch('/api/registration/appeals');
                if (res.ok) {
                    const data = await res.json();
                    setAppeals(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchAppeals();
    }, []);

    const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
        if (!selectedAppeal || !notes) return;

        try {
            const res = await fetch('/api/registration/appeals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    applicationId: selectedAppeal.id,
                    decision,
                    notes
                })
            });

            if (res.ok) {
                setAppeals(appeals.filter(a => a.id !== selectedAppeal.id));
                setSelectedAppeal(null);
                setNotes('');
                alert(`Appeal ${decision.toLowerCase()}d successfully`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-indigo-800 tracking-tight">
                    Appeals Management
                </h1>
                <p className="text-gray-500 mt-2 text-lg">Review and decide on appeals for rejected registration applications.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Appeals List */}
                <div className="lg:col-span-1 glass-panel p-6 overflow-hidden flex flex-col h-[600px]">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="p-2 bg-amber-100 text-amber-600 rounded-lg text-sm">⚖️</span>
                        Active Cases
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="space-y-3">
                                <div className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                                <div className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
                            </div>
                        ) : appeals.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 italic">No appeals pending review</div>
                        ) : (
                            appeals.map(appeal => (
                                <button
                                    key={appeal.id}
                                    onClick={() => setSelectedAppeal(appeal)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border-2 ${selectedAppeal?.id === appeal.id
                                            ? 'bg-primary-50 border-primary-500 shadow-lg shadow-primary-500/10'
                                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="font-bold text-gray-900 mb-1">{appeal.proposedName}</div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <span>{appeal.applicationType.replace('_', ' ')}</span>
                                        <span className="text-amber-600 font-bold">New Appeal</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Appeal Detail View */}
                <div className="lg:col-span-2 glass-panel p-8 min-h-[600px] flex flex-col shadow-2xl">
                    {selectedAppeal ? (
                        <div className="flex flex-col h-full space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900">{selectedAppeal.proposedName}</h2>
                                    <p className="text-gray-500 mt-1">File Number: {selectedAppeal.fileNumber || 'Pending'}</p>
                                </div>
                                <div className="px-4 py-2 bg-amber-50 rounded-xl">
                                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1 text-center">Assigned Case</div>
                                    <div className="text-xs font-black text-gray-900">APPEAL-2026-{(appeals.indexOf(selectedAppeal) + 1).toString().padStart(3, '0')}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Original Reject Reason</div>
                                    <div className="text-sm text-gray-700 font-medium whitespace-pre-wrap leading-relaxed">
                                        {selectedAppeal.rejectionReasons || 'Reasoning was not formally documented.'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Reject Decision By</div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                            {selectedAppeal.finalDecisionMaker?.firstName?.charAt(0) || 'R'}
                                        </div>
                                        <div className="text-sm font-bold text-gray-900">
                                            {selectedAppeal.finalDecisionMaker?.firstName} {selectedAppeal.finalDecisionMaker?.lastName}
                                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter mt-0.5">Official Registrar</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Decision Rationale & Notes</label>
                                <textarea
                                    className="w-full h-40 p-4 bg-white rounded-2xl border-2 border-gray-200 focus:border-primary-500 focus:ring-0 transition-all resize-none text-gray-700"
                                    placeholder="Outline the legal and strategic basis for overturning or upholding the original decision..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-gray-100">
                                <button
                                    onClick={() => handleDecision('REJECT')}
                                    className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all hover:-translate-y-1 shadow-xl active:scale-95"
                                >
                                    Uphold Original Rejection
                                </button>
                                <button
                                    onClick={() => handleDecision('APPROVE')}
                                    className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-bold transition-all hover:-translate-y-1 shadow-xl shadow-primary-500/30 hover:bg-primary-700 active:scale-95"
                                >
                                    Overturn & Grant Approval
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6 grayscale opacity-50">⚖️</div>
                            <h3 className="text-2xl font-bold text-gray-900 italic">Select a case to review</h3>
                            <p className="text-gray-400 max-w-xs mt-2 font-medium">
                                Use the sidebar to select an active appeal. You have the final executive authority to approve or reject these cases.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
