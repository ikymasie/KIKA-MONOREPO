'use client';

import { useState } from 'react';

interface TicketModalProps {
    memberId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function TicketModal({ memberId, onClose, onSuccess }: TicketModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await fetch('/api/admin/member-service/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, memberId })
            });

            if (!res.ok) throw new Error('Failed to create ticket');

            onSuccess();
            onClose();
        } catch (err) {
            alert('Error creating ticket');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">Open Support Ticket</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
                            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                <option value="general">General Inquiry</option>
                                <option value="loan">Loan Issues</option>
                                <option value="savings">Savings Inquiry</option>
                                <option value="insurance">Insurance Claim</option>
                                <option value="kyc">KYC Verification</option>
                                <option value="it">Technical Support</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Priority</label>
                            <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                        <input required placeholder="Brief summary of the issue" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea required rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Detailed description of the problem..." />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 btn btn-primary">
                            {loading ? 'Creating...' : 'Open Ticket'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
