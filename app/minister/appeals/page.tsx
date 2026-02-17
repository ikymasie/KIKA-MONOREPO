'use client';

import { useEffect, useState } from 'react';

export default function MinisterAppeals() {
    const [appeals, setAppeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
    const [notes, setNotes] = useState('');
    const [deciding, setDeciding] = useState(false);

    useEffect(() => {
        async function fetchAppeals() {
            try {
                const res = await fetch('/api/registration/minister/appeals');
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
        if (!selectedAppeal || !notes) {
            alert('Please provide decision rationale and notes.');
            return;
        }

        setDeciding(true);
        try {
            const res = await fetch('/api/registration/minister/appeals', {
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
            } else {
                const err = await res.json();
                alert(`Error: ${err.error}`);
            }
        } catch (e) {
            console.error(e);
            alert('A network error occurred.');
        } finally {
            setDeciding(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-900 tracking-tight">
                    Appeals Adjudication
                </h1>
                <p className="text-gray-500 mt-2 text-lg font-medium">Final executive review of contested registration decisions.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Appeals Ledger */}
                <div className="lg:col-span-1 glass-panel p-6 flex flex-col h-[700px] border-indigo-100/50">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl text-sm">⚖️</span>
                        Active Appeal Cases
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {loading ? (
                            Array(4).fill(0).map((_, i) => (
                                <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse"></div>
                            ))
                        ) : appeals.length === 0 ? (
                            <div className="text-center py-20">
                                <span className="text-5xl block mb-4 grayscale opacity-30">✨</span>
                                <p className="text-gray-400 font-bold italic text-sm">No appeals pending review.</p>
                            </div>
                        ) : (
                            appeals.map(appeal => (
                                <button
                                    key={appeal.id}
                                    onClick={() => setSelectedAppeal(appeal)}
                                    className={`w-full text-left p-5 rounded-2xl transition-all border-2 group ${selectedAppeal?.id === appeal.id
                                        ? 'bg-indigo-50 border-indigo-500 shadow-xl shadow-indigo-500/10'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-indigo-200'
                                        }`}
                                >
                                    <div className="font-black text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{appeal.proposedName}</div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <span>{appeal.applicationType.replace('_', ' ')}</span>
                                        <span className="text-indigo-600 font-black">ACTION REQ</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Case Review & Decision */}
                <div className="lg:col-span-2 glass-panel p-10 min-h-[700px] flex flex-col shadow-2xl border-indigo-100/50">
                    {selectedAppeal ? (
                        <div className="flex flex-col h-full space-y-8">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{selectedAppeal.proposedName}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-sm font-bold text-gray-400 italic">File: {selectedAppeal.fileNumber || 'Unassigned'}</span>
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-tighter">Ministerial Review</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Appeal Lodged</div>
                                    <div className="text-sm font-bold text-gray-900">{new Date(selectedAppeal.appealLodgedAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                        Prior Rejection Grounds
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed italic">
                                        "{selectedAppeal.rejectionReasons || 'Official reasoning was not documented in previous stage.'}"
                                    </p>
                                </div>
                                <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100/50">
                                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Applicant Justification</div>
                                    <p className="text-sm text-indigo-900/80 font-medium leading-relaxed">
                                        {selectedAppeal.appealOutcome || 'No specific reasoning provided in the appeal lodge.'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Ministerial Decision Rationale</label>
                                <textarea
                                    className="flex-1 p-6 bg-white rounded-3xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-0 transition-all resize-none text-gray-700 font-medium text-lg shadow-inner"
                                    placeholder="Outline the final executive rationale for this decision. This statement will be permanently recorded in the official registry..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-3 italic">* This decision is final and cannot be further appealed within the administrative branch.</p>
                            </div>

                            <div className="flex gap-6 pt-8 border-t border-gray-100">
                                <button
                                    disabled={deciding}
                                    onClick={() => handleDecision('REJECT')}
                                    className="flex-1 py-5 bg-white border-2 border-gray-900 text-gray-900 rounded-2xl font-black hover:bg-gray-900 hover:text-white transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    Uphold Prior Decision
                                </button>
                                <button
                                    disabled={deciding}
                                    onClick={() => handleDecision('APPROVE')}
                                    className="flex-1 py-5 bg-gradient-to-r from-indigo-700 to-purple-800 text-white rounded-2xl font-black transition-all hover:-translate-y-1 shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {deciding ? 'Processing...' : 'Overturn & Grant Approval'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                            <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner animate-pulse">⚖️</div>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">Select Case for Adjudication</h3>
                            <p className="text-gray-400 max-w-sm mt-4 font-medium leading-relaxed">
                                Review the legal and strategic arguments of the society and the prior regulatory findings to reach a final decision.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
