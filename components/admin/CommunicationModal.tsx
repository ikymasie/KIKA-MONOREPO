'use client';

import { useState } from 'react';

interface CommModalProps {
    memberId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CommunicationModal({ memberId, onClose, onSuccess }: CommModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'call',
        direction: 'outbound',
        subject: '',
        content: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await fetch('/api/admin/member-service/communications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, memberId })
            });

            if (!res.ok) throw new Error('Failed to log communication');

            onSuccess();
            onClose();
        } catch (err) {
            alert('Error logging communication');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">Log Interaction</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                <option value="call">Phone Call</option>
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="in_person">In Person</option>
                                <option value="whatsapp">WhatsApp</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Direction</label>
                            <select value={formData.direction} onChange={e => setFormData({ ...formData, direction: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                <option value="outbound">Outbound (Rep -{'>'} Member)</option>
                                <option value="inbound">Inbound (Member -{'>'} Rep)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Subject</label>
                        <input required placeholder="e.g. Loan Inquiry, Balance Check" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Content / Notes</label>
                        <textarea required rows={4} value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="Details of the interaction..." />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 btn btn-primary">
                            {loading ? 'Logging...' : 'Save Interaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
