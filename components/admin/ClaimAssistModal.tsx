'use client';

import { useState } from 'react';

interface ClaimAssistModalProps {
    memberId: string;
    policies: any[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function ClaimAssistModal({ memberId, policies, onClose, onSuccess }: ClaimAssistModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        policyId: policies[0]?.id || '',
        claimType: 'death',
        claimAmount: 0,
        incidentDate: '',
        description: '',
        supportingDocuments: [] as string[]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await fetch('/api/admin/member-service/claims/assist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to submit claim');

            onSuccess();
            onClose();
        } catch (err) {
            alert('Error submitting claim');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-xl p-8 shadow-2xl relative border-t-8 border-primary-600">
                <h2 className="text-2xl font-bold mb-2">Claim Assistance</h2>
                <p className="text-gray-500 text-sm mb-6">File an insurance claim on behalf of the member.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Policy</label>
                            <select required value={formData.policyId} onChange={e => setFormData({ ...formData, policyId: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                {policies.map(p => (
                                    <option key={p.id} value={p.id}>{p.product?.name} ({p.policyNumber})</option>
                                ))}
                                {policies.length === 0 && <option value="">No Active Policies</option>}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Claim Type</label>
                            <select value={formData.claimType} onChange={e => setFormData({ ...formData, claimType: (e.target.value as any) })} className="w-full px-4 py-2 border rounded-lg">
                                <option value="death">Death</option>
                                <option value="disability">Disability</option>
                                <option value="critical_illness">Critical Illness</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Incident Date</label>
                            <input required type="date" value={formData.incidentDate} onChange={e => setFormData({ ...formData, incidentDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Claim Amount (P)</label>
                            <input required type="number" value={formData.claimAmount} onChange={e => setFormData({ ...formData, claimAmount: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Event Description</label>
                        <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Details of the incident..." />
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 italic text-xs text-gray-500">
                        Note: Supporting documents should be uploaded via the Document Verification Workflow after submission.
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading || policies.length === 0} className="flex-1 btn btn-primary">
                            {loading ? 'Submitting...' : 'Submit Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
