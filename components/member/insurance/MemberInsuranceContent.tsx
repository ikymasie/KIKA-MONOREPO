'use client';

import { useState, useEffect } from 'react';
import { useBranding } from '@/components/providers/BrandingProvider';

export default function MemberInsuranceContent() {
    const [data, setData] = useState<{ policies: any[], availableProducts: any[] }>({ policies: [], availableProducts: [] });
    const [loading, setLoading] = useState(true);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
    const { branding } = useBranding();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/member/insurance');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Failed to fetch member insurance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const submitClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        // Logic for submitting claim
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const body = Object.fromEntries(formData.entries());

        try {
            const res = await fetch('/api/member/insurance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    policyId: selectedPolicy.id,
                    ...body,
                }),
            });

            if (res.ok) {
                setShowClaimModal(false);
                alert('Claim submitted successfully!');
            }
        } catch (error) {
            console.error('Claim submission failed:', error);
        }
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-900 p-12 text-white shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl font-black mb-4 tracking-tight">Insurance & Wellness</h1>
                    <p className="text-blue-100 text-lg font-medium leading-relaxed">
                        Protect what matters most. Manage your active cover and explore new schemes designed specifically for your SACCO member benefits.
                    </p>
                </div>
                <div className="absolute top-0 right-0 p-12 text-9xl opacity-10 select-none">🛡️</div>
            </div>

            {/* My Policies */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <span className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 text-xl shadow-inner">📜</span>
                    Your Active Policies
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {loading ? (
                        Array(2).fill(0).map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse"></div>)
                    ) : data.policies.length === 0 ? (
                        <div className="col-span-full py-12 px-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                            <p className="text-gray-500 font-bold">You don't have any active insurance policies yet.</p>
                        </div>
                    ) : (
                        data.policies.map((policy) => (
                            <div key={policy.id} className="glass-panel p-8 bg-white shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{policy.product?.name}</h3>
                                        <p className="text-xs font-mono font-bold text-primary-600 uppercase tracking-widest">{policy.policyNumber}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${policy.status === 'active' ? 'bg-success-50 text-success-700 border-success-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                        {policy.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Coverage</p>
                                        <p className="text-2xl font-black text-gray-900">P {Number(policy.coverageAmount).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Premium</p>
                                        <p className="text-xl font-bold text-primary-600">P {Number(policy.monthlyPremium).toLocaleString()}/mo</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setSelectedPolicy(policy); setShowClaimModal(true); }}
                                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
                                >
                                    File a Claim
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Marketplace */}
            <section className="space-y-6">
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <span className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 text-xl shadow-inner">✨</span>
                    Available Schemes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse"></div>)
                    ) : (
                        data.availableProducts.map((product) => (
                            <div key={product.id} className="relative group overflow-hidden rounded-[2rem] bg-white border border-gray-100 p-8 hover:shadow-2xl transition-all duration-500">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-100 transition-all"></div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                                <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2">{product.description || 'Comprehensive coverage tailored for our members.'}</p>
                                <div className="space-y-3 mb-8">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400 font-medium">Monthly Premium</span>
                                        <span className="font-bold text-gray-900">P {Number(product.monthlyPremium).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400 font-medium">Coverage Limit</span>
                                        <span className="font-bold text-gray-900">P {Number(product.coverageAmount).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400 font-medium">Waiting Period</span>
                                        <span className="font-bold text-gray-900">{product.waitingPeriodMonths} Months</span>
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-primary-50 text-primary-600 rounded-xl font-bold group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                                    Learn More
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Claim Modal */}
            {showClaimModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <form onSubmit={submitClaim} className="p-10 space-y-8">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">File an Insurance Claim</h3>
                                <p className="text-gray-500 font-medium mt-1">Submit your claim for processing under policy {selectedPolicy?.policyNumber}.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Claim Type</label>
                                <select name="claimType" required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none text-sm font-bold">
                                    <option value="death">Death Benefit</option>
                                    <option value="disability">Disability</option>
                                    <option value="critical_illness">Critical Illness</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Incident Date</label>
                                    <input type="date" name="incidentDate" required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none text-sm font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Claim Amount (P)</label>
                                    <input type="number" name="claimAmount" defaultValue={selectedPolicy?.coverageAmount} required className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none text-sm font-bold" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                                <textarea name="description" required rows={4} className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none text-sm font-medium resize-none" placeholder="Provide details about the incident..."></textarea>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowClaimModal(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                                <button type="submit" className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95">Submit Claim</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
