'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface Vendor {
    id: string;
    name: string;
    code: string;
}

interface Policy {
    id: string;
    policyNumber: string;
    member: {
        firstName: string;
        lastName: string;
    };
}

export default function PaymentsPage() {
    const [view, setView] = useState<'vendor' | 'insurance'>('vendor');
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        vendorId: '',
        policyId: '',
        amount: 0,
        description: ''
    });

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [vRes, pRes] = await Promise.all([
                    fetch('/api/admin/merchandise/vendors'), // Assuming this exists based on dir structure
                    fetch('/api/admin/insurance') // Assuming this exists or returns list
                ]);

                if (vRes.ok) setVendors(await vRes.json());

                // For demo/impl, if these fail we'll use empty arrays
                // In production, we'd handle errors properly
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    async function handlePayment(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);
        try {
            const endpoint = view === 'vendor' ? '/api/admin/accounting/payments/vendors' : '/api/admin/accounting/payments/insurance';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                alert('Payment processed successfully and recorded in General Ledger');
                setFormData({ vendorId: '', policyId: '', amount: 0, description: '' });
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to process payment');
            }
        } catch (error) {
            alert('Error processing payment');
        } finally {
            setProcessing(false);
        }
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Processing</h1>
                    <p className="text-gray-600">Disburse funds to vendors and insurance providers</p>
                </div>

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => { setView('vendor'); setFormData({ ...formData, policyId: '' }); }}
                        className={`flex-1 p-6 rounded-2xl border-2 transition-all ${view === 'vendor' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-lg' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                    >
                        <div className="text-3xl mb-2">🏢</div>
                        <div className="font-black uppercase tracking-widest text-xs">Vendor Payment</div>
                    </button>
                    <button
                        onClick={() => { setView('insurance'); setFormData({ ...formData, vendorId: '' }); }}
                        className={`flex-1 p-6 rounded-2xl border-2 transition-all ${view === 'insurance' ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-lg' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                    >
                        <div className="text-3xl mb-2">🛡️</div>
                        <div className="font-black uppercase tracking-widest text-xs">Insurance Payout</div>
                    </button>
                </div>

                <div className="card p-8 bg-white border border-gray-100 rounded-3xl shadow-xl max-w-2xl">
                    <form onSubmit={handlePayment} className="space-y-6">
                        {view === 'vendor' ? (
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Select Vendor</label>
                                <select
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
                                    value={formData.vendorId}
                                    onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                                >
                                    <option value="">Choose a vendor...</option>
                                    {vendors.map(v => (
                                        <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Select Policy / Member</label>
                                <input
                                    required
                                    placeholder="Enter Policy ID or Member Name"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
                                    value={formData.policyId}
                                    onChange={e => setFormData({ ...formData, policyId: e.target.value })}
                                />
                                <p className="text-[10px] text-gray-400 mt-1 italic">Enter the unique identifier for the insurance claim or policy</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Payment Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">P</span>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary-500 font-bold text-lg"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Payment Description / Memo</label>
                            <textarea
                                required
                                rows={3}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
                                placeholder="Details for the General Ledger entry..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                disabled={processing}
                                type="submit"
                                className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-lg
                                    ${processing ? 'bg-gray-200 text-gray-400' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/20 active:scale-95'}`}
                            >
                                {processing ? 'Processing Payment...' : '🚀 Authorize Disbursal'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
