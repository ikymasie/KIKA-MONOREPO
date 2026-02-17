'use client';

import { useState, useEffect } from 'react';
import { SkeletonCard } from '@/components/common/SkeletonLoader';

export default function ClaimWorkflow() {
    const [claims, setClaims] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaim, setSelectedClaim] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/insurance/claims');
            if (res.ok) {
                const data = await res.json();
                setClaims(data);
            }
        } catch (error) {
            console.error('Failed to fetch claims:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateClaimStatus = async (id: string, status: string, notes: string = '') => {
        try {
            setProcessing(true);
            const res = await fetch('/api/admin/insurance/claims', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status, reviewNotes: notes }),
            });

            if (res.ok) {
                await fetchClaims();
                setSelectedClaim(null);
            }
        } catch (error) {
            console.error('Failed to update claim:', error);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
            case 'approved': return 'bg-success-50 text-success-700 border-success-100';
            case 'submitted':
            case 'under_review': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'rejected': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="flex flex-col h-full bg-white/50">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Claim Queue</h3>
                <button onClick={fetchClaims} className="text-sm font-bold text-primary-600 hover:text-primary-700">Refresh</button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="p-6 space-y-4">
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                ) : claims.length === 0 ? (
                    <div className="p-20 text-center space-y-4">
                        <div className="text-4xl">✅</div>
                        <h4 className="font-bold text-gray-900">No Pending Claims</h4>
                        <p className="text-gray-500">All insurance claims have been processed.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {claims.map((claim) => (
                            <div key={claim.id} className="p-6 flex items-start justify-between hover:bg-white/80 transition-all cursor-pointer group" onClick={() => setSelectedClaim(claim)}>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-black text-gray-900">{claim.policy?.member?.fullName}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusColor(claim.status)}`}>
                                            {claim.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                        <span>📜 {claim.claimNumber}</span>
                                        <span>📅 {new Date(claim.incidentDate).toLocaleDateString()}</span>
                                        <span className="text-primary-600">🛡️ {claim.policy?.product?.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-1">{claim.description}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <div className="text-xl font-black text-gray-900">P {Number(claim.claimAmount).toLocaleString()}</div>
                                    <div className="text-xs text-gray-400 font-bold">SUBMITTED {new Date(claim.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Claim Review Modal */}
            {selectedClaim && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Review Insurance Claim</h3>
                                <p className="text-gray-500 font-medium mt-1">{selectedClaim.claimNumber} • {selectedClaim.policy?.member?.fullName}</p>
                            </div>
                            <button onClick={() => setSelectedClaim(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Claim Type</label>
                                    <span className="text-sm font-bold text-gray-900 uppercase">{selectedClaim.claimType}</span>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Claim Amount</label>
                                    <span className="text-sm font-bold text-gray-900">P {Number(selectedClaim.claimAmount).toLocaleString()}</span>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Incident Date</label>
                                    <span className="text-sm font-bold text-gray-900">{new Date(selectedClaim.incidentDate).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Description</label>
                                <p className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 p-4 rounded-xl">{selectedClaim.description}</p>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-100">
                                <h4 className="font-bold text-gray-900 text-sm">Action & Review Notes</h4>
                                <textarea
                                    id="reviewNotes"
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-100 outline-none text-sm min-h-[100px]"
                                    placeholder="Add notes for the review process..."
                                />
                                <div className="flex gap-4">
                                    <button
                                        disabled={processing}
                                        onClick={() => updateClaimStatus(selectedClaim.id, 'rejected', (document.getElementById('reviewNotes') as HTMLTextAreaElement)?.value)}
                                        className="flex-1 py-3 border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
                                    >
                                        Reject Claim
                                    </button>
                                    <button
                                        disabled={processing}
                                        onClick={() => updateClaimStatus(selectedClaim.id, 'approved', (document.getElementById('reviewNotes') as HTMLTextAreaElement)?.value)}
                                        className="flex-1 py-3 bg-success-600 text-white font-bold rounded-xl hover:bg-success-700 shadow-lg shadow-success-100 transition-all disabled:opacity-50"
                                    >
                                        Approve Claim
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
