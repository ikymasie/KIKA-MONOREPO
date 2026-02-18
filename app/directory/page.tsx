'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, Phone, Mail, Globe, ArrowRight } from 'lucide-react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import LoginDialog from '@/components/landing/LoginDialog';

interface Tenant {
    id: string;
    name: string;
    code: string;
    registrationNumber?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    createdAt: string;
}

export default function DirectoryPage() {
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const res = await fetch('/api/public/directory');
                if (res.ok) {
                    const data = await res.json();
                    setTenants(data.data);
                }
            } catch (error) {
                console.error('Failed to fetch directory', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTenants();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = `/directory/search?q=${encodeURIComponent(searchQuery)}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <LandingNav onLoginClick={() => setIsLoginDialogOpen(true)} />

            <main className="flex-grow pt-24 pb-16">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Saccos & Cooperatives Directory
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Browse our comprehensive list of registered societies and cooperatives in Botswana.
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-2xl mx-auto mb-16">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search directory..."
                                className="w-full px-6 py-4 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg pl-14"
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                            <button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 px-6 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Directory Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-64 bg-white rounded-xl shadow-sm animate-pulse">
                                    <div className="h-1/2 bg-gray-200 rounded-t-xl"></div>
                                    <div className="p-6 space-y-3">
                                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {tenants.map((tenant) => (
                                <Link
                                    key={tenant.id}
                                    href={`/directory/${tenant.id}`}
                                    className="block group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden"
                                >
                                    <div className="h-32 bg-gradient-to-r from-gray-100 to-gray-50 relative">
                                        {tenant.logoUrl ? (
                                            <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-xl bg-white shadow-md p-1">
                                                <img
                                                    src={tenant.logoUrl}
                                                    alt={tenant.name}
                                                    className="w-full h-full object-contain rounded-lg"
                                                />
                                            </div>
                                        ) : (
                                            <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-xl bg-white shadow-md flex items-center justify-center text-gray-400 font-bold text-2xl">
                                                {tenant.name.substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-12 p-6">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                                            {tenant.name}
                                        </h3>
                                        <div className="space-y-2 text-sm text-gray-600 mb-6">
                                            {tenant.address && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={16} className="mt-0.5" />
                                                    <span className="line-clamp-2">{tenant.address}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center text-primary-600 font-medium text-sm">
                                            View Details <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <LandingFooter />

            <LoginDialog
                isOpen={isLoginDialogOpen}
                onClose={() => setIsLoginDialogOpen(false)}
            />
        </div>
    );
}
