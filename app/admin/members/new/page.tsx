'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function NewMemberPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        memberNumber: '',
        firstName: '',
        lastName: '',
        middleName: '',
        nationalId: '',
        dateOfBirth: '',
        gender: 'male',
        email: '',
        phone: '',
        employmentStatus: 'employed',
        employer: '',
        joinDate: new Date().toISOString().split('T')[0],
        physicalAddress: '',
        postalAddress: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('/api/admin/members/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || 'Failed to create member');
            }

            alert('Member created successfully! An account has been created for them with default password: Welcome123!');
            router.push(`/admin/members/${result.data.id}`);
        } catch (err: any) {
            setError(err.message);
            window.scrollTo(0, 0);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8 max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Members
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Add New Member</h1>
                    <p className="text-gray-600 mt-1">Register a new member manually in the system.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-6 border-b pb-2">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">Member Number *</label>
                                <input
                                    type="text"
                                    name="memberNumber"
                                    value={formData.memberNumber}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="e.g. SK-2024-001"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">National ID / Passport *</label>
                                <input
                                    type="text"
                                    name="nationalId"
                                    value={formData.nationalId}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="National ID Number"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">First Name *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Last Name *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Middle Name (Optional)</label>
                                <input
                                    type="text"
                                    name="middleName"
                                    value={formData.middleName}
                                    onChange={handleChange}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Date of Birth *</label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Gender *</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Join Date *</label>
                                <input
                                    type="date"
                                    name="joinDate"
                                    value={formData.joinDate}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-6 border-b pb-2">Contact Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">Email Address *</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Phone Number *</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="+267..."
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="label">Physical Address</label>
                                <textarea
                                    name="physicalAddress"
                                    value={formData.physicalAddress}
                                    onChange={handleChange}
                                    className="input min-h-[100px]"
                                    placeholder="Enter physical residential address"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="label">Postal Address</label>
                                <textarea
                                    name="postalAddress"
                                    value={formData.postalAddress}
                                    onChange={handleChange}
                                    className="input min-h-[100px]"
                                    placeholder="Enter postal address (P.O. Box)"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Employment Information */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold mb-6 border-b pb-2">Employment Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="label">Employment Status *</label>
                                <select
                                    name="employmentStatus"
                                    value={formData.employmentStatus}
                                    onChange={handleChange}
                                    className="input"
                                    required
                                >
                                    <option value="employed">Employed</option>
                                    <option value="self_employed">Self Employed</option>
                                    <option value="unemployed">Unemployed</option>
                                    <option value="retired">Retired</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Employer Name</label>
                                <input
                                    type="text"
                                    name="employer"
                                    value={formData.employer}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Name of company/organization"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn btn-secondary px-8"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary px-8"
                            disabled={loading}
                        >
                            {loading ? 'Creating Member...' : 'Register Member'}
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
