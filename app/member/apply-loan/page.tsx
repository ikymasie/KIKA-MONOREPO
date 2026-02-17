'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';

interface LoanProduct {
    id: string;
    name: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    interestRate: number;
    maxTermMonths: number;
}

export default function ApplyLoanPage() {
    const router = useRouter();
    const [products, setProducts] = useState<LoanProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        productId: '',
        principalAmount: '',
        termMonths: '',
        purpose: ''
    });

    useEffect(() => {
        async function fetchProducts() {
            try {
                const response = await fetch('/api/member/apply-loan');
                if (!response.ok) throw new Error('Failed to fetch available loan products');
                const data = await response.json();
                setProducts(data);
                if (data.length > 0) {
                    setFormData(prev => ({ ...prev, productId: data[0].id }));
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    const selectedProduct = products.find(p => p.id === formData.productId);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/member/apply-loan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to submit application');
            }

            alert('Application submitted successfully!');
            router.push('/member/loans');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit">Apply for a Loan</h1>
                    <p className="text-gray-600">Choose a loan product and enter your application details</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-danger-50 border border-danger-200 text-danger-700 rounded-xl">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="card p-8 space-y-6 shadow-xl shadow-gray-200/50">
                            <div>
                                <label className="label">Select Loan Product</label>
                                <select
                                    className="input w-full"
                                    value={formData.productId}
                                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                    required
                                >
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Principal Amount (P)</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        placeholder="Enter amount"
                                        value={formData.principalAmount}
                                        onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                                        min={selectedProduct?.minAmount}
                                        max={selectedProduct?.maxAmount}
                                        required
                                    />
                                    {selectedProduct && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Limit: P {selectedProduct.minAmount.toLocaleString()} - {selectedProduct.maxAmount.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="label">Term (Months)</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        placeholder="Enter months"
                                        value={formData.termMonths}
                                        onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                                        max={selectedProduct?.maxTermMonths}
                                        required
                                    />
                                    {selectedProduct && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Max term: {selectedProduct.maxTermMonths} months
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="label">Purpose of Loan</label>
                                <textarea
                                    className="input w-full h-32 py-3"
                                    placeholder="Explain what the loan will be used for..."
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full btn btn-primary py-4 text-lg"
                            >
                                {submitting ? 'Submitting Application...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>

                    <div className="space-y-6">
                        <div className="card p-6 bg-primary-50 border-primary-100">
                            <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                                <span>ℹ️</span> Product Details
                            </h3>
                            {selectedProduct ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">Interest Rate</p>
                                        <p className="text-2xl font-bold text-primary-900">{selectedProduct.interestRate}% <span className="text-sm font-normal text-primary-700">p.a.</span></p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-primary-600 font-bold uppercase tracking-wider">Description</p>
                                        <p className="text-sm text-primary-800 leading-relaxed">{selectedProduct.description}</p>
                                    </div>
                                    <div className="pt-4 border-t border-primary-200">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-primary-700">Estimated Monthly</span>
                                            <span className="font-bold text-primary-900">
                                                P {formData.principalAmount && formData.termMonths ?
                                                    (Number(formData.principalAmount) / Number(formData.termMonths) * (1 + (selectedProduct.interestRate / 100))).toFixed(2) :
                                                    '--'
                                                }
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-primary-600">Final installment will be calculated upon approval.</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-primary-700">Select a product to see details.</p>
                            )}
                        </div>

                        <div className="card p-6 border-warning-200 bg-warning-50/30">
                            <h3 className="font-bold text-warning-900 mb-2">Requirements</h3>
                            <ul className="text-xs text-warning-800 space-y-2 list-disc pl-4">
                                <li>Proof of income (latest 3 months payslips)</li>
                                <li>Minimum 6 months membership</li>
                                <li>At least 2 active guarantors required</li>
                                <li>No active defaults in the last 12 months</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
