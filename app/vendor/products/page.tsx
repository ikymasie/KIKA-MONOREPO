'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import VendorSidebar from '@/components/layout/VendorSidebar';
import { MerchandiseCategory } from '@/src/entities/MerchandiseProduct';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: MerchandiseCategory;
    retailPrice: number;
    costPrice: number;
    stockQuantity: number;
    description: string;
}

export default function VendorProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        sku: '',
        category: MerchandiseCategory.ELECTRONICS,
        retailPrice: '',
        costPrice: '',
        stockQuantity: '',
        description: ''
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/vendor/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/vendor/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct),
            });
            if (res.ok) {
                setShowAddModal(false);
                fetchProducts();
                setNewProduct({
                    name: '',
                    sku: '',
                    category: MerchandiseCategory.ELECTRONICS,
                    retailPrice: '',
                    costPrice: '',
                    stockQuantity: '',
                    description: ''
                });
            }
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    return (
        <DashboardLayout sidebar={<VendorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Product Catalog</h1>
                        <p className="text-slate-500 font-medium text-lg">Manage your inventory and product listings.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                alert('Inventory synchronization in progress...');
                                setTimeout(() => alert('Sync completed successfully!'), 1500);
                            }}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-900 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-xl shadow-slate-100 flex items-center gap-2"
                        >
                            <span>🔄</span> Sync Inventory
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                        >
                            + Add New Product
                        </button>
                    </div>
                </header>

                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product Info</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No products found. Start by adding your first product.
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-6">
                                            <div className="font-black text-slate-900">{product.name}</div>
                                            <div className="text-xs text-slate-500 font-medium">SKU: {product.sku}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="font-black text-slate-900">N$ {product.retailPrice.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Cost: N$ {product.costPrice.toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={`font-black ${product.stockQuantity < 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                                                {product.stockQuantity} Units
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button className="text-slate-400 hover:text-slate-900 transition-colors px-2">Edit</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Product Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add New Product</h2>
                                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900">✕</button>
                            </div>
                            <form onSubmit={handleAddProduct} className="p-8 grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SKU</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium"
                                        value={newProduct.sku}
                                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium appearance-none"
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as MerchandiseCategory })}
                                    >
                                        {Object.values(MerchandiseCategory).map(cat => (
                                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Retail Price (N$)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium"
                                        value={newProduct.retailPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, retailPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cost Price (N$)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium"
                                        value={newProduct.costPrice}
                                        onChange={(e) => setNewProduct({ ...newProduct, costPrice: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Initial Stock</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium"
                                        value={newProduct.stockQuantity}
                                        onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium h-24"
                                        value={newProduct.description}
                                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="col-span-2 flex justify-end gap-4 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-6 py-3 font-black text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                                    >
                                        Save Product
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
