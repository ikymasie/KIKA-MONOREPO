'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    retailPrice: number;
    description?: string;
    imageUrl?: string;
    flyerUrl?: string;
    stockQuantity: number;
    minimumTermMonths: number;
    maximumTermMonths: number;
    interestRate: number;
}

export default function MemberProductDetail() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);

    // Application State
    const [quantity, setQuantity] = useState(1);
    const [term, setTerm] = useState(12);
    const [monthlyInstallment, setMonthlyInstallment] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        fetchProduct();
    }, [params.id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/products/merchandise/${params.id}`); // Reusing admin GET for detail, adjust if needed
            if (!response.ok) throw new Error('Product not found');
            const data = await response.json();
            setProduct(data);

            // Initial calculations
            setTerm(data.maximumTermMonths || 12);
            calculateInstallment(1, data.maximumTermMonths || 12, data);
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateInstallment = (qty: number, t: number, p: Product) => {
        const principal = p.retailPrice * qty;
        const annualRate = (p.interestRate || 0) / 100;
        const monthlyRate = annualRate / 12;

        let installment = 0;
        if (monthlyRate > 0) {
            installment = (principal * monthlyRate * Math.pow(1 + monthlyRate, t)) / (Math.pow(1 + monthlyRate, t) - 1);
        } else {
            installment = principal / t;
        }

        setMonthlyInstallment(installment);
        setTotalAmount(principal);
    };

    const handleApply = async () => {
        if (!product) return;

        try {
            setApplying(true);
            const response = await fetch('/api/member/merchandise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product.id,
                    quantity,
                    totalAmount,
                    termMonths: term,
                    monthlyInstallment
                }),
            });

            const data = await response.json();
            if (response.ok) {
                router.push(`/member/dashboard?success=order_${data.orderNumber}`);
            } else {
                alert(data.error || 'Failed to submit application');
            }
        } catch (error) {
            alert('Something went wrong. Please try again.');
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout sidebar={<MemberSidebar />}>
                <div className="p-8 max-w-6xl mx-auto animate-pulse">
                    <div className="flex gap-12">
                        <div className="w-1/2 h-[500px] bg-gray-100 rounded-[3rem]"></div>
                        <div className="w-1/2 space-y-8">
                            <div className="h-12 bg-gray-100 rounded-xl w-3/4"></div>
                            <div className="h-32 bg-gray-100 rounded-3xl"></div>
                            <div className="h-48 bg-gray-100 rounded-3xl"></div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!product) return null;

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-6xl mx-auto">
                <Link href="/member/marketplace" className="text-primary-600 font-bold flex items-center gap-1 mb-8 hover:underline">
                    ← Back to Marketplace
                </Link>

                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Media Gallery */}
                    <div className="lg:w-1/2">
                        <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-primary-50 flex items-center justify-center relative overflow-hidden group border-2 border-gray-50">
                            {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="object-contain max-h-[400px] group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                                <span className="text-[12rem] grayscale opacity-5">🛍️</span>
                            )}

                            <div className="absolute bottom-8 left-8 right-8 flex gap-4">
                                {product.flyerUrl && (
                                    <a
                                        href={product.flyerUrl}
                                        target="_blank"
                                        className="flex-1 py-4 bg-white/80 backdrop-blur-md border border-gray-200 text-gray-700 rounded-2xl font-bold text-sm text-center shadow-lg hover:bg-white transition-all flex items-center justify-center gap-2"
                                    >
                                        📄 Download Flyer
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Product Info & Calculator */}
                    <div className="lg:w-1/2 flex flex-col">
                        <div className="mb-8">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-primary-600 mb-2">{product.category}</div>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4">{product.name}</h1>
                            <div className="text-3xl font-black text-gray-900 mb-6">P {Number(product.retailPrice).toLocaleString()}</div>
                            <p className="text-gray-500 font-medium leading-relaxed text-lg">
                                {product.description || 'Elevate your lifestyle with this premium selection. Available exclusively through our SACCO credit scheme.'}
                            </p>
                        </div>

                        {/* Credit Component */}
                        <div className="glass-panel p-8 md:p-10 border-2 border-primary-500/20 bg-primary-50/10">
                            <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                                <span className="w-8 h-8 bg-primary-600 text-white rounded-lg flex items-center justify-center text-sm">₹</span>
                                Hire-Purchase Calculator
                            </h3>

                            <div className="space-y-10">
                                {/* Quantity */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Select Quantity</label>
                                        <span className="text-2xl font-black text-gray-900">{quantity}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max={Math.min(product.stockQuantity, 5)}
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setQuantity(val);
                                            calculateInstallment(val, term, product);
                                        }}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                </div>

                                {/* Term */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-sm font-black text-gray-400 uppercase tracking-widest">Payment Term (Months)</label>
                                        <span className="text-2xl font-black text-gray-900">{term} months</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={product.minimumTermMonths || 1}
                                        max={product.maximumTermMonths || 12}
                                        value={term}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setTerm(val);
                                            calculateInstallment(quantity, val, product);
                                        }}
                                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                    />
                                </div>

                                {/* Results */}
                                <div className="grid grid-cols-2 gap-6 pt-6 border-t font-primary border-primary-200/30">
                                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Installment</div>
                                        <div className="text-2xl font-black text-primary-600">P {Math.ceil(monthlyInstallment).toLocaleString()}</div>
                                    </div>
                                    <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Interest Rate (p.a)</div>
                                        <div className="text-2xl font-black text-gray-900">{product.interestRate}%</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleApply}
                                    disabled={applying || product.stockQuantity <= 0}
                                    className="w-full py-6 bg-primary-600 text-white rounded-[1.5rem] font-black text-xl shadow-2xl shadow-primary-200 hover:bg-primary-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {applying ? 'Submitting Application...' : 'Apply for Credit'}
                                </button>

                                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                                    Approval is subject to affordability and SACCO policy
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
