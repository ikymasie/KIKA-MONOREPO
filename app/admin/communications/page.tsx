'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function CommunicationsPage() {
    const [type, setType] = useState('email');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [deliveryStatus, setDeliveryStatus] = useState<any>(null);

    useEffect(() => {
        fetchDeliveryStatus();
    }, []);

    const fetchDeliveryStatus = async () => {
        try {
            const res = await fetch('/api/admin/communications/delivery-status');
            const data = await res.json();
            setDeliveryStatus(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setResult(null);
        try {
            const res = await fetch('/api/admin/communications/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, subject, content }),
            });
            const data = await res.json();
            setResult(data);
            if (res.ok) {
                setSubject('');
                setContent('');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
            fetchDeliveryStatus();
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Member Communications</h1>
                    <p className="text-gray-500">Send bulk announcements to all active members via SMS or Email.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="card p-8">
                            <form onSubmit={handleSend} className="space-y-6">
                                <div className="flex gap-4 p-1 bg-gray-100 rounded-xl w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setType('email')}
                                        className={`px-6 py-2 rounded-lg font-bold transition-all ${type === 'email' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
                                    >
                                        📧 Email
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setType('sms')}
                                        className={`px-6 py-2 rounded-lg font-bold transition-all ${type === 'sms' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
                                    >
                                        📱 SMS
                                    </button>
                                </div>

                                {type === 'email' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                                        <input
                                            type="text"
                                            className="input w-full"
                                            placeholder="e.g. Annual General Meeting Notice"
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-gray-700">Message Content</label>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${content.length > 160 && type === 'sms' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {content.length} characters {type === 'sms' && `(Approx. ${Math.ceil(content.length / 160)} SMS)`}
                                        </span>
                                    </div>
                                    <textarea
                                        className="input w-full focus:ring-2 focus:ring-primary-500 transition-all"
                                        rows={10}
                                        placeholder={type === 'email' ? 'Enter your full email content here...' : 'Enter SMS content...'}
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        Sends to all <strong>Active</strong> members by default.
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="btn btn-primary px-8"
                                    >
                                        {sending ? 'Sending...' : `Broadcast ${type.toUpperCase()}`}
                                    </button>
                                </div>
                            </form>

                            {result && (
                                <div className={`mt-6 p-4 rounded-xl border ${result.success ? 'bg-success-50 border-success-200 text-success-700' : 'bg-danger-50 border-danger-200 text-danger-700'}`}>
                                    {result.message || result.error}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="card p-6 bg-primary-50 border-none">
                            <h3 className="font-bold text-primary-800 mb-2">Broadcast Tips</h3>
                            <ul className="text-sm text-primary-700 space-y-2 list-disc pl-4">
                                <li>Keep SMS under 160 characters to avoid multiple charges.</li>
                                <li>Professional tone is recommended for all regulatory notices.</li>
                                <li>Communications are logged in each member's profile.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
