'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Mail, Globe, Calendar, ShieldCheck, FileText, ArrowLeft, Building2 } from 'lucide-react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import LoginDialog from '@/components/landing/LoginDialog';

interface TenantDetail {
    id: string;
    name: string;
    code: string;
    registrationNumber?: string;
    registrationDate?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    createdAt: string;
    complianceRating?: string;
    currentComplianceScore?: number;
}

export default function TenantDetailPage({ params }: { params: { id: string } }) {
    const [tenant, setTenant] = useState<TenantDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

    useEffect(() => {
        const fetchTenant = async () => {
            try {
                const res = await fetch(`/api/public/directory/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setTenant(data.data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error('Error fetching tenant details:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchTenant();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !tenant) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Tenant Not Found</h1>
                <Link href="/directory" className="text-primary-600 hover:underline flex items-center">
                    <ArrowLeft size={16} className="mr-2" /> Back to Directory
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <LandingNav onLoginClick={() => setIsLoginDialogOpen(true)} />

            <main className="flex-grow pt-24 pb-16">
                {/* Banner / Header */}
                <div className="bg-white border-b border-gray-200">
                    <div className="container mx-auto px-4 py-8 md:py-12">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-gray-100">
                                {tenant.logoUrl ? (
                                    <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 className="text-gray-400 w-12 h-12" />
                                )}
                            </div>
                            <div className="flex-grow">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{tenant.name}</h1>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                    {tenant.registrationNumber && (
                                        <div className="flex items-center gap-1">
                                            <FileText size={16} />
                                            <span>Reg: {tenant.registrationNumber}</span>
                                        </div>
                                    )}
                                    {tenant.registrationDate && (
                                        <div className="flex items-center gap-1">
                                            <Calendar size={16} />
                                            <span>Est. {new Date(tenant.registrationDate).getFullYear()}</span>
                                        </div>
                                    )}
                                    {tenant.complianceRating && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tenant.complianceRating === 'A' ? 'bg-green-100 text-green-700' :
                                                tenant.complianceRating === 'B' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            Rating: {tenant.complianceRating}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsLoginDialogOpen(true)}
                                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
                                >
                                    Login / Join
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Main Info */}
                        <div className="md:col-span-2 space-y-8">
                            {/* About Section (Placeholder for now, could come from BrandingSettings or Description field if added) */}
                            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">About Us</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    {tenant.name} is a registered cooperative society dedicated to serving its members.
                                    Contact us to learn more about our services, membership eligibility, and benefits.
                                </p>
                            </section>

                            {/* Detailed Info */}
                            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Registration Details</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-500 mb-1">Entity Name</div>
                                        <div className="font-medium">{tenant.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">Society Code</div>
                                        <div className="font-medium">{tenant.code}</div>
                                    </div>
                                    {tenant.registrationNumber && (
                                        <div>
                                            <div className="text-gray-500 mb-1">Registration Number</div>
                                            <div className="font-medium">{tenant.registrationNumber}</div>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-gray-500 mb-1">Status</div>
                                        <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Active
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar / Contact */}
                        <div className="space-y-6">
                            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
                                <div className="space-y-4">
                                    {tenant.address && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-gray-400 mt-1" size={18} />
                                            <div>
                                                <div className="text-sm text-gray-500">Address</div>
                                                <div className="text-sm font-medium">{tenant.address}</div>
                                            </div>
                                        </div>
                                    )}
                                    {tenant.email && (
                                        <div className="flex items-start gap-3">
                                            <Mail className="text-gray-400 mt-1" size={18} />
                                            <div>
                                                <div className="text-sm text-gray-500">Email</div>
                                                <a href={`mailto:${tenant.email}`} className="text-sm font-medium text-primary-600 hover:underline">
                                                    {tenant.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                    {tenant.phone && (
                                        <div className="flex items-start gap-3">
                                            <Phone className="text-gray-400 mt-1" size={18} />
                                            <div>
                                                <div className="text-sm text-gray-500">Phone</div>
                                                <a href={`tel:${tenant.phone}`} className="text-sm font-medium text-primary-600 hover:underline">
                                                    {tenant.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <LandingFooter />
            <LoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />
        </div>
    );
}
