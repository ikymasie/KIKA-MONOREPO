'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import Link from 'next/link';
import { getProductThumbnail } from '@/lib/image-utils';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    retailPrice: number;
    stockQuantity: number;
    status: string;
    imageUrl?: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<{ success: number; errors: string[] } | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/products/merchandise');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadResult(null);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/admin/products/merchandise/bulk', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            setUploadResult(data);
            if (data.success > 0) {
                fetchProducts();
            }
        } catch (error) {
            console.error('Bulk upload failed:', error);
            alert('Bulk upload failed. Please check the file format.');
        } finally {
            setUploading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <Link href="/admin/merchandise" className="text-primary-600 font-bold flex items-center gap-1 mb-2 hover:underline">
                            ← Back to Hub
                        </Link>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Product Catalog</h1>
                    </div>
                    <div className="flex gap-4">
                        <label className={`px-6 py-3 cursor-pointer rounded-xl font-bold transition-all flex items-center gap-2 ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 border-2 border-gray-100 hover:border-primary-500'}`}>
                            {uploading ? 'Uploading...' : '📁 Bulk Upload'}
                            <input type="file" accept=".csv" onChange={handleBulkUpload} hidden disabled={uploading} />
                        </label>
                        <Link href="/admin/products?type=merchandise" className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
                            + New Product
                        </Link>
                    </div>
                </div>

                {uploadResult && (
                    <div className={`p-6 rounded-2xl mb-8 border-2 ${uploadResult.errors.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className={`font-bold ${uploadResult.errors.length > 0 ? 'text-amber-800' : 'text-green-800'}`}>
                                    Successfully imported {uploadResult.success} products.
                                </h4>
                                {uploadResult.errors.length > 0 && (
                                    <p className="text-sm text-amber-700 mt-1">
                                        Encountered {uploadResult.errors.length} errors during processing.
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setUploadResult(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        {uploadResult.errors.length > 0 && (
                            <div className="mt-4 max-h-32 overflow-y-auto bg-white/50 rounded-lg p-3 text-xs font-mono text-amber-900">
                                {uploadResult.errors.map((err, i) => <div key={i}>• {err}</div>)}
                            </div>
                        )}
                    </div>
                )}

                <div className="glass-panel mb-8 p-4">
                    <input
                        type="text"
                        placeholder="Search products by name or SKU..."
                        className="w-full bg-transparent border-none focus:ring-0 text-lg font-medium placeholder:text-gray-400"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-3xl"></div>)}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredProducts.map((product) => (
                            <div key={product.id} className="glass-panel group overflow-hidden border-2 border-transparent hover:border-primary-500 transition-all flex flex-col">
                                <div className="h-48 bg-gray-50 flex items-center justify-center relative overflow-hidden">
                                    {product.imageUrl ? (
                                        <img src={getProductThumbnail(product.imageUrl)} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                    ) : (
                                        <span className="text-6xl grayscale opacity-20">📦</span>
                                    )}
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-2 py-1 text-[10px] font-black uppercase rounded shadow-sm ${product.status === 'active' ? 'bg-success-500 text-white' : 'bg-gray-400 text-white'
                                            }`}>
                                            {product.status}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-2 py-1 text-[10px] font-black uppercase rounded bg-white/90 text-gray-900 shadow-sm border border-gray-100">
                                            {product.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <span>SKU: {product.sku}</span>
                                        <span className={product.stockQuantity < 5 ? 'text-red-500' : 'text-gray-500'}>
                                            {product.stockQuantity} in stock
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors">{product.name}</h3>

                                    <div className="mt-auto pt-4 flex justify-between items-center border-t border-gray-100">
                                        <div className="text-2xl font-black text-gray-900">P {Number(product.retailPrice).toLocaleString()}</div>
                                        <div className="flex gap-2">
                                            <button className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors">
                                                ✏️
                                            </button>
                                            <button className="p-2 bg-gray-50 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-bold text-gray-900">No products found</h3>
                                <p className="text-gray-500">Try adjusting your search or create a new product.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
