'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { useBranding } from '@/components/providers/BrandingProvider';
import { getProductThumbnail } from '@/lib/image-utils';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    retailPrice: number;
    description?: string;
    imageUrl?: string;
    stockQuantity: number;
}

export default function MemberMarketplace() {
    const router = useRouter();
    const { branding } = useBranding();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/member/merchandise');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch marketplace products:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['all', ...new Set(products.map(p => p.category))];

    const filteredProducts = products.filter(p => {
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                {/* Hero Header */}
                <div className="relative rounded-[2rem] bg-gradient-to-br from-primary-600 to-indigo-900 p-12 overflow-hidden mb-12 shadow-2xl shadow-primary-200">
                    <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center pointer-events-none">
                        <span className="text-[12rem] rotate-12">🛒</span>
                    </div>
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">SACCO Marketplace</h1>
                        <p className="text-primary-100 text-lg font-medium">
                            Premium products available on hire-purchase. Get what you need today and pay in easy monthly installments via payroll deduction.
                        </p>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-6 py-2.5 rounded-full text-sm font-bold border-2 transition-all whitespace-nowrap ${categoryFilter === cat
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200'
                                    : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                                    }`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Find products..."
                            className="w-full px-12 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-primary-500 focus:ring-4 focus:ring-primary-50 font-medium transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-30">🔍</span>
                    </div>
                </div>

                {/* Product Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-96 bg-gray-100 rounded-[2.5rem]"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => router.push(`/member/marketplace/${product.id}`)}
                                className="group bg-white rounded-[2.5rem] overflow-hidden border-2 border-transparent hover:border-primary-500 hover:shadow-3xl hover:shadow-primary-100 transition-all cursor-pointer flex flex-col"
                            >
                                <div className="h-64 bg-gray-50 relative overflow-hidden flex items-center justify-center p-8">
                                    {product.imageUrl ? (
                                        <img
                                            src={getProductThumbnail(product.imageUrl)}
                                            alt={product.name}
                                            className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <span className="text-8xl grayscale opacity-10 group-hover:opacity-20 transition-opacity">🛍️</span>
                                    )}
                                    <div className="absolute top-6 right-6">
                                        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-primary-600 shadow-sm border border-black/5">
                                            {product.category}
                                        </span>
                                    </div>
                                    {product.stockQuantity <= 0 && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                                            <span className="px-4 py-2 bg-red-500 text-white font-black uppercase rounded-lg shadow-lg">Out of Stock</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-1">{product.name}</h3>
                                    <p className="text-gray-500 text-sm font-medium line-clamp-2 mb-6 h-10">
                                        {product.description || 'Premium high-quality asset selected for our members.'}
                                    </p>

                                    <div className="mt-auto flex items-end justify-between">
                                        <div>
                                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-tighter mb-0.5">Total Price</div>
                                            <div className="text-3xl font-black text-gray-900 tracking-tight">P {Number(product.retailPrice).toLocaleString()}</div>
                                        </div>
                                        <button className="h-14 w-14 bg-gray-100 rounded-2xl flex items-center justify-center text-xl group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                                            <span>→</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-32 text-center bg-gray-50/50 rounded-[3rem] border-4 border-dashed border-gray-100">
                                <div className="text-8xl mb-6 opacity-20">🔎</div>
                                <h3 className="text-3xl font-black text-gray-900 mb-2">No items found</h3>
                                <p className="text-gray-500 font-medium">We couldn't find any products matching your search or filter.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
