'use client';

import { useState } from 'react';

interface BeneficiaryModalProps {
    memberId: string;
    existingBeneficiaries: any[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function BeneficiaryModal({ memberId, existingBeneficiaries, onClose, onSuccess }: BeneficiaryModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        relationship: 'spouse',
        dateOfBirth: '',
        nationalId: '',
        phone: '',
        address: '',
        allocationPercentage: 0
    });

    const totalAllocation = existingBeneficiaries.reduce((sum, b) => sum + Number(b.allocationPercentage), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (totalAllocation + Number(formData.allocationPercentage) > 100) {
            alert(`Total allocation cannot exceed 100%. Remaining: ${100 - totalAllocation}%`);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/admin/member-service/beneficiaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, memberId })
            });

            if (!res.ok) throw new Error('Failed to add beneficiary');

            onSuccess();
            onClose();
        } catch (err) {
            alert('Error adding beneficiary');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">Add Beneficiary</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                            <input required name="firstName" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                            <input required name="lastName" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Relationship</label>
                            <select name="relationship" value={formData.relationship} onChange={e => setFormData({ ...formData, relationship: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
                                <option value="spouse">Spouse</option>
                                <option value="child">Child</option>
                                <option value="parent">Parent</option>
                                <option value="sibling">Sibling</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Allocation (%)</label>
                            <input required type="number" max={100 - totalAllocation} name="allocationPercentage" value={formData.allocationPercentage} onChange={e => setFormData({ ...formData, allocationPercentage: Number(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">National ID</label>
                            <input required name="nationalId" value={formData.nationalId} onChange={e => setFormData({ ...formData, nationalId: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Date of Birth</label>
                            <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Phone (Optional)</label>
                        <input name="phone" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 btn btn-primary">
                            {loading ? 'Adding...' : 'Add Beneficiary'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
