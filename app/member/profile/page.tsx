'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { format } from 'date-fns';

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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            try {
                const response = await fetch('/api/member/profile');
                if (!response.ok) throw new Error('Failed to fetch profile data');
                const data = await response.json();
                setProfile(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, []);

    if (loading) return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        </DashboardLayout>
    );

    if (error || !profile) return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8">
                <div className="card p-6 bg-danger-50 text-danger-700">{error || 'Failed to load profile'}</div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-5xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit">My Profile</h1>
                    <p className="text-gray-600">Manage your personal information and membership details</p>
                </div>

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
                        {/* Personal Information */}
                        <div className="card p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="p-2 bg-primary-100 text-primary-600 rounded-lg text-sm">👤</span>
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <InfoItem label="Full Name" value={`${profile.firstName} ${profile.middleName || ''} ${profile.lastName}`} />
                                <InfoItem label="National ID" value={profile.nationalId} />
                                <InfoItem label="Email Address" value={profile.email} />
                                <InfoItem label="Phone Number" value={profile.phone} />
                                <InfoItem label="Date of Birth" value={format(new Date(profile.dateOfBirth), 'MMMM dd, yyyy')} />
                                <InfoItem label="Gender" value={profile.gender} />
                            </div>
                        </div>

                        {/* Employment & Address */}
                        <div className="card p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg text-sm">🏢</span>
                                Employment & Address
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <InfoItem label="Employment Status" value={profile.employmentStatus} />
                                <InfoItem label="Employer" value={profile.employer || 'Not specified'} />
                                <div className="md:col-span-2">
                                    <InfoItem label="Physical Address" value={profile.physicalAddress} />
                                </div>
                            </div>
                        </div>
                    </div>
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
