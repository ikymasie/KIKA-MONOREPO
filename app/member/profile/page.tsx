'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { format } from 'date-fns';
import KYCManagement from '@/components/member/KYCManagement';
import { Pencil, Check, X } from 'lucide-react';

interface MemberProfile {
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    phone: string;
    memberNumber: string;
    nationalId: string;
    dateOfBirth: string;
    gender: string;
    physicalAddress: string;
    employmentStatus: string;
    employer: string;
    joinDate: string;
    tenant: {
        name: string;
    };
}

export default function MemberProfilePage() {
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);

    // Editable fields
    const [editPhone, setEditPhone] = useState('');
    const [editAddress, setEditAddress] = useState('');
    const [editEmployer, setEditEmployer] = useState('');
    const [editEmploymentStatus, setEditEmploymentStatus] = useState('');

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch('/api/member/profile');
                if (!response.ok) throw new Error('Failed to fetch profile data');
                const data = await response.json();
                setProfile(data);
                setEditPhone(data.phone ?? '');
                setEditAddress(data.physicalAddress ?? '');
                setEditEmployer(data.employer ?? '');
                setEditEmploymentStatus(data.employmentStatus ?? '');
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSuccessMsg(null);
        setError(null);
        try {
            const res = await fetch('/api/member/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: editPhone,
                    physicalAddress: editAddress,
                    employer: editEmployer,
                    employmentStatus: editEmploymentStatus,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to save');
            setProfile(prev => prev ? { ...prev, phone: editPhone, physicalAddress: editAddress, employer: editEmployer, employmentStatus: editEmploymentStatus } : prev);
            setSuccessMsg('Profile updated successfully.');
            setEditing(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (profile) {
            setEditPhone(profile.phone ?? '');
            setEditAddress(profile.physicalAddress ?? '');
            setEditEmployer(profile.employer ?? '');
            setEditEmploymentStatus(profile.employmentStatus ?? '');
        }
        setEditing(false);
        setError(null);
    };

    if (loading) return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        </DashboardLayout>
    );

    if (!profile) return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8">
                <div className="card p-6 bg-danger-50 text-danger-700">{error || 'Failed to load profile'}</div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-5xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 font-outfit">My Profile</h1>
                        <p className="text-gray-600">Manage your personal information and membership details</p>
                    </div>
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                        >
                            <Pencil size={16} />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                <X size={16} />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-success-600 text-white rounded-xl font-bold text-sm hover:bg-success-700 transition-all shadow-lg shadow-success-200 disabled:opacity-50"
                            >
                                <Check size={16} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>

                {successMsg && (
                    <div className="mb-6 p-4 bg-success-50 border border-success-200 text-success-700 rounded-xl font-semibold text-sm">
                        ✅ {successMsg}
                    </div>
                )}
                {error && (
                    <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl font-semibold text-sm">
                        ❌ {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar/Quick Info */}
                    <div className="space-y-6">
                        <div className="card p-8 text-center shadow-xl shadow-indigo-500/5">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg shadow-primary-500/30">
                                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h2>
                            <p className="text-primary-600 font-bold text-sm tracking-widest mt-1 uppercase">{profile.tenant.name}</p>
                            <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2">
                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Member ID</div>
                                <div className="text-lg font-mono font-bold text-gray-900">{profile.memberNumber}</div>
                            </div>
                        </div>

                        <div className="card p-6 bg-gray-50 border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Membership Status</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Joined Date</span>
                                    <span className="font-semibold">{format(new Date(profile.joinDate), 'MMM dd, yyyy')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Account Status</span>
                                    <span className="px-2 py-0.5 bg-success-100 text-success-700 rounded-full text-[10px] font-bold uppercase">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Personal Information — read-only (admin sets these) */}
                        <div className="card p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="p-2 bg-primary-100 text-primary-600 rounded-lg text-sm">👤</span>
                                Personal Information
                                <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase tracking-wider">Read-only</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <InfoItem label="Full Name" value={`${profile.firstName} ${profile.middleName || ''} ${profile.lastName}`} />
                                <InfoItem label="National ID" value={profile.nationalId} />
                                <InfoItem label="Email Address" value={profile.email} />
                                <InfoItem label="Date of Birth" value={format(new Date(profile.dateOfBirth), 'MMMM dd, yyyy')} />
                                <InfoItem label="Gender" value={profile.gender} />
                            </div>
                        </div>

                        {/* Contact & Employment — editable */}
                        <div className="card p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm">🏢</span>
                                Contact & Employment
                                {editing && <span className="ml-auto text-[10px] font-bold text-primary-500 uppercase tracking-wider animate-pulse">Editing</span>}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {/* Phone */}
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Phone Number</p>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={editPhone}
                                            onChange={e => setEditPhone(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-primary-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-400 outline-none bg-primary-50"
                                        />
                                    ) : (
                                        <p className="text-base font-semibold text-gray-900">{profile.phone}</p>
                                    )}
                                </div>

                                {/* Employment Status */}
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Employment Status</p>
                                    {editing ? (
                                        <select
                                            value={editEmploymentStatus}
                                            onChange={e => setEditEmploymentStatus(e.target.value)}
                                            className="w-full px-4 py-2.5 border border-primary-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-400 outline-none bg-primary-50"
                                        >
                                            <option value="employed">Employed</option>
                                            <option value="self_employed">Self-Employed</option>
                                            <option value="unemployed">Unemployed</option>
                                            <option value="retired">Retired</option>
                                        </select>
                                    ) : (
                                        <p className="text-base font-semibold text-gray-900 capitalize">{profile.employmentStatus}</p>
                                    )}
                                </div>

                                {/* Employer */}
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Employer</p>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={editEmployer}
                                            onChange={e => setEditEmployer(e.target.value)}
                                            placeholder="e.g. Government of Botswana"
                                            className="w-full px-4 py-2.5 border border-primary-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-400 outline-none bg-primary-50"
                                        />
                                    ) : (
                                        <p className="text-base font-semibold text-gray-900">{profile.employer || 'Not specified'}</p>
                                    )}
                                </div>

                                {/* Physical Address */}
                                <div className="md:col-span-2 space-y-1">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Physical Address</p>
                                    {editing ? (
                                        <textarea
                                            value={editAddress}
                                            onChange={e => setEditAddress(e.target.value)}
                                            rows={3}
                                            placeholder="Plot number, ward, village/city"
                                            className="w-full px-4 py-2.5 border border-primary-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary-400 outline-none bg-primary-50 resize-none"
                                        />
                                    ) : (
                                        <p className="text-base font-semibold text-gray-900">{profile.physicalAddress}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KYC Documents — full width */}
                    <KYCManagement />
                </div>
            </div>
        </DashboardLayout>
    );
}

function InfoItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="space-y-1">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{label}</p>
            <p className="text-base font-semibold text-gray-900">{value}</p>
        </div>
    );
}
