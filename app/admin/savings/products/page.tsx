'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface SavingsProduct {
    id: string;
    name: string;
    code: string;
    interestRate: number;
    minimumBalance: number;
    interestEarningThreshold: number;
    minMonthlyContribution: number;
    status: string;
}

export default function AdminSavingsProductsPage() {
    const [products, setProducts] = useState<SavingsProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        interestRate: 0,
        minimumBalance: 0,
        minMonthlyContribution: 0,
        interestEarningThreshold: 0,
        description: '',
        isShareCapital: false,
        allowWithdrawals: true
    });

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/admin/products/savings');
            if (!response.ok) throw new Error('Failed to fetch savings products');
            const data = await response.json();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch('/api/admin/products/savings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to create product');

            alert('Product created successfully!');
            setIsModalOpen(false);
            fetchProducts();
            setFormData({
                name: '',
                code: '',
                interestRate: 0,
                minimumBalance: 0,
                minMonthlyContribution: 0,
                interestEarningThreshold: 0,
                description: '',
                isShareCapital: false,
                allowWithdrawals: true
            });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Savings Products</h1>
                        <p className="text-gray-600">Configure interest rates and contribution rules</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn btn-primary px-6 py-2 rounded-lg font-bold flex items-center gap-2"
                    >
                        + Create New Product
                    </button>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="card h-48 bg-gray-100"></div>)}
                    </div>
                ) : error ? (
                    <div className="card p-6 bg-danger-50 text-danger-700">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(product => (
                            <div key={product.id} className="card p-6 border-l-4 border-primary-500 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.code}</div>
                                        <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-success-100 text-success-700">
                                        {product.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-gray-400">Yield</div>
                                        <div className="text-xl font-bold text-gray-900">{product.interestRate}%</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-gray-400">Min Contribution</div>
                                        <div className="text-xl font-bold text-gray-900">P {product.minMonthlyContribution}</div>
                                    </div>
                                </div>
                                <div className="mt-auto pt-6 border-t border-gray-100 flex justify-between gap-3">
                                    <button className="flex-1 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">Edit</button>
                                    <button className="flex-1 text-xs font-bold text-danger-500 hover:text-danger-700 transition-colors">Deactivate</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <form onSubmit={handleSubmit}>
                                <div className="p-6 border-b border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-900">New Savings Product</h2>
                                    <p className="text-sm text-gray-500">Define rules for a new investment option</p>
                                </div>
                                <div className="p-6 grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Product Name</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Premium Growth Fund"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Product Code</label>
                                        <input
                                            required
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="e.g. SAV-PREM"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Description</label>
                                        <textarea
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Interest Rate (% p.a.)</label>
                                        <input
                                            type="number" step="0.01"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                            value={formData.interestRate}
                                            onChange={e => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Min. Monthly Contribution</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                                            value={formData.minMonthlyContribution}
                                            onChange={e => setFormData({ ...formData, minMonthlyContribution: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isShareCapital"
                                            checked={formData.isShareCapital}
                                            onChange={e => setFormData({ ...formData, isShareCapital: e.target.checked })}
                                        />
                                        <label htmlFor="isShareCapital" className="text-sm font-bold text-gray-700">Is Share Capital?</label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="allowWithdrawals"
                                            checked={formData.allowWithdrawals}
                                            onChange={e => setFormData({ ...formData, allowWithdrawals: e.target.checked })}
                                        />
                                        <label htmlFor="allowWithdrawals" className="text-sm font-bold text-gray-700">Allow Withdrawals?</label>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? 'Creating...' : 'Create Product'}
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
