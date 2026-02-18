'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, ArrowRight } from 'lucide-react';
import LandingNav from '@/components/landing/LandingNav';
import LandingFooter from '@/components/landing/LandingFooter';
import LoginDialog from '@/components/landing/LoginDialog';

interface Tenant {
    id: string;
    name: string;
    code: string;
    registrationNumber?: string;
    address?: string;
    logoUrl?: string;
}

function SearchResultsContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

    useEffect(() => {
        const fetchTenants = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/public/directory?q=${encodeURIComponent(searchQuery)}`);
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

        if (searchQuery) {
            fetchTenants();
        } else {
            // If no query, maybe fetch all or just show empty? Fetching all for now.
            fetchTenants();
        }
    }, [searchQuery]); // Re-fetch when internal state changes? or just initial?

    // Actually, we should probably fetch based on URL param if we want to support back button properly, 
    // but the search bar updates internal state. 
    // Let's make the search bar drive the URL, and the URL drive the fetch.

    // Better approach:
    // 1. Initial load from URL.
    // 2. Search form submit pushes new URL.
    // 3. useEffect on [searchParams] fetches data.

    // Correction:
    // The useEffect above with [searchQuery] is wrong if we want URL as source of truth.
    // Let's refactor.

    return null; // Placeholder to avoid rendering before logic fix
}

// Rewriting logic inside the main component to be cleaner
function SearchPageInner() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [inputQuery, setInputQuery] = useState(query);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

    // Sync input with URL query when it changes (e.g. back button)
    useEffect(() => {
        setInputQuery(query);
    }, [query]);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/public/directory?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setTenants(data.data);
                }
            } catch (error) {
                console.error('Failed to search directory', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Use Next.js router for client-side navigation which integrates with useSearchParams
        router.push(`/directory/search?q=${encodeURIComponent(inputQuery)}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <LandingNav onLoginClick={() => setIsLoginDialogOpen(true)} />

            <main className="flex-grow pt-24 pb-16">
                <div className="container mx-auto px-4">
                    {/* Search Header */}
                    <div className="max-w-4xl mx-auto mb-12">
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            window.location.href = `/directory/search?q=${encodeURIComponent(inputQuery)}`;
                        }} className="relative flex items-center">
                            <input
                                type="text"
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                                placeholder="Search directory..."
                                className="w-full px-6 py-4 rounded-full border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg pl-14 pr-32"
                            />
                            <Search className="absolute left-5 text-gray-400" size={24} />
                            <button
                                type="submit"
                                className="absolute right-2 px-6 py-2 bg-primary-600 text-white rounded-full font-medium hover:bg-primary-700 transition-colors"
                            >
                                Search
                            </button>
                        </form>
                    </div>

                    {/* Results Count */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {loading ? 'Searching...' : `Found ${tenants.length} results for "${query}"`}
                        </h2>
                    </div>

                    {/* Results Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-64 bg-white rounded-xl shadow-sm animate-pulse"></div>
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
                                    <div className="h-32 bg-gray-100 relative">
                                        {/* Simplified card for now, ensuring similar structure to main page */}
                                        <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden">
                                            {tenant.logoUrl ? (
                                                <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-xl font-bold text-gray-400">{tenant.name.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pt-12 p-6">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{tenant.name}</h3>
                                        {tenant.address && (
                                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                                <MapPin size={14} className="mr-1" />
                                                <span className="line-clamp-1">{tenant.address}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-primary-600 text-sm font-medium group-hover:underline">
                                            View Profile <ArrowRight size={16} className="ml-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {!loading && tenants.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                            <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                            <p className="text-gray-500">Try adjusting your search terms</p>
                        </div>
                    )}
                </div>
            </main>
            <LandingFooter />
            <LoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <SearchPageInner />
        </Suspense>
    );
}
