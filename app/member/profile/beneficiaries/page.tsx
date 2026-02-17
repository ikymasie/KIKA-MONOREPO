'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { format } from 'date-fns';

interface Beneficiary {
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    dateOfBirth: string;
    nationalId: string;
    phone?: string;
    address?: string;
    allocationPercentage: number;
}

export default function BeneficiariesPage() {
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
    const [formData, setFormData] = useState<Partial<Beneficiary>>({
        relationship: 'spouse',
        allocationPercentage: 0
    });

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    const fetchBeneficiaries = async () => {
        try {
            const res = await fetch('/api/member/beneficiaries');
            if (res.ok) {
                const data = await res.json();
                setBeneficiaries(data);
            }
        } catch (error) {
            console.error('Failed to fetch beneficiaries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const method = editingBeneficiary ? 'PUT' : 'POST';
        const body = editingBeneficiary ? { ...formData, id: editingBeneficiary.id } : formData;

        try {
            const res = await fetch('/api/member/beneficiaries', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setShowModal(false);
                fetchBeneficiaries();
                alert(editingBeneficiary ? 'Beneficiary updated' : 'Beneficiary added');
            }
        } catch (error) {
            console.error('Failed to save beneficiary:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this beneficiary?')) return;

        try {
            const res = await fetch(`/api/member/beneficiaries?id=${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchBeneficiaries();
                alert('Beneficiary removed');
            }
        } catch (error) {
            console.error('Failed to delete beneficiary:', error);
        }
    };

    const totalAllocation = beneficiaries.reduce((sum, b) => sum + Number(b.allocationPercentage), 0);

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Beneficiaries</h1>
                        <p className="text-gray-500 font-medium text-lg mt-2">Manage your nominated beneficiaries and their allocation percentages.</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingBeneficiary(null);
                            setFormData({ relationship: 'spouse', allocationPercentage: 0 });
                            setShowModal(true);
                        }}
                        className="py-4 px-8 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
                    >
                        + Add Beneficiary
                    </button>
                </div>

                {totalAllocation !== 100 && beneficiaries.length > 0 && (
                    <div className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-center gap-4 text-amber-700">
                        <span className="text-3xl">⚠️</span>
                        <div className="font-bold">
                            Total allocation is <span className="text-red-600 underline">{totalAllocation}%</span>. It must equal 100% for insurance and benefits processing.
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[1, 2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-[2rem] animate-pulse"></div>)}
                    </div>
                ) : beneficiaries.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-6 opacity-40">👪</div>
                        <h3 className="text-2xl font-bold text-gray-900">No Beneficiaries Added</h3>
                        <p className="text-gray-500 mt-2 font-medium">Please nominate your beneficiaries to ensure your benefits are distributed as you wish.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {beneficiaries.map((b) => (
                            <div key={b.id} className="glass-panel p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/50 group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                            {b.firstName.charAt(0)}{b.lastName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{b.firstName} {b.lastName}</h3>
                                            <p className="text-xs font-black text-primary-600 uppercase tracking-widest">{b.relationship}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-gray-900">{b.allocationPercentage}%</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Allocation</p>
                                    </div>
                                </div>
                                <div className="space-y-3 mb-8 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">National ID</span>
                                        <span className="font-bold text-gray-900">{b.nationalId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 font-medium">Phone</span>
                                        <span className="font-bold text-gray-900">{b.phone || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setEditingBeneficiary(b);
                                            setFormData(b);
                                            setShowModal(true);
                                        }}
                                        className="flex-1 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition-all"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(b.id)}
                                        className="flex-1 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                <h2 className="text-3xl font-black text-gray-900">{editingBeneficiary ? 'Edit Beneficiary' : 'Add New Beneficiary'}</h2>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">First Name</label>
                                        <input
                                            required
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold"
                                            value={formData.firstName || ''}
                                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                                        <input
                                            required
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold"
                                            value={formData.lastName || ''}
                                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Relationship</label>
                                        <select
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold"
                                            value={formData.relationship || 'spouse'}
                                            onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                                        >
                                            <option value="spouse">Spouse</option>
                                            <option value="child">Child</option>
                                            <option value="parent">Parent</option>
                                            <option value="sibling">Sibling</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Allocation %</label>
                                        <input
                                            type="number"
                                            max="100"
                                            required
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-2xl"
                                            value={formData.allocationPercentage || 0}
                                            onChange={e => setFormData({ ...formData, allocationPercentage: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">National ID</label>
                                        <input
                                            required
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold"
                                            value={formData.nationalId || ''}
                                            onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Date of Birth</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold"
                                            value={formData.dateOfBirth ? format(new Date(formData.dateOfBirth), 'yyyy-MM-dd') : ''}
                                            onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 text-gray-500 font-bold hover:bg-gray-50 rounded-2xl transition-all">Cancel</button>
                                    <button type="submit" className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all">Save Beneficiary</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
