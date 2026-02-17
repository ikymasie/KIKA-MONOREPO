'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PRODUCT_CONFIG, ProductType } from '../products/ProductCreationWizard';

export default function ProductFactory() {
    const router = useRouter();
    const [products, setProducts] = useState<{
        savings: any[];
        loan: any[];
        insurance: any[];
        merchandise: any[];
    }>({
        savings: [],
        loan: [],
        insurance: [],
        merchandise: []
    });
    const [loading, setLoading] = useState(true);
    const [showSelectionModal, setShowSelectionModal] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            setLoading(true);
            const [savingsRes, loansRes, insuranceRes, merchandiseRes] = await Promise.all([
                fetch('/api/admin/products/savings'),
                fetch('/api/admin/products/loans'),
                fetch('/api/admin/products/insurance'),
                fetch('/api/admin/products/merchandise')
            ]);

            const newProductsState = {
                savings: [],
                loan: [],
                insurance: [],
                merchandise: []
            };

            if (savingsRes.ok) newProductsState.savings = await savingsRes.json();
            if (loansRes.ok) newProductsState.loan = await loansRes.json();
            if (insuranceRes.ok) newProductsState.insurance = await insuranceRes.json();
            if (merchandiseRes.ok) newProductsState.merchandise = await merchandiseRes.json();

            setProducts(newProductsState);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setLoading(false);
        }
    }

    const renderCard = (type: ProductType, product: any) => {
        const isSavings = type === 'savings';
        const isLoan = type === 'loan';
        const isInsurance = type === 'insurance';
        const isMerchandise = type === 'merchandise';

        return (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer relative group">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-bold text-gray-900">{product.name}</h4>
                        <p className="text-xs text-gray-500 font-mono uppercase">{product.code || product.sku}</p>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${product.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-gray-50 text-gray-700'
                        }`}>
                        {product.status || 'active'}
                    </span>
                </div>

                <div className="space-y-2 mb-4">
                    {isSavings && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Interest Rate</span>
                                <span className="font-medium">{product.interestRate}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Min. Balance</span>
                                <span className="font-medium">P {Number(product.minimumBalance || 0).toLocaleString()}</span>
                            </div>
                            {product.maximumBalance && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Max. Balance</span>
                                    <span className="font-medium">P {Number(product.maximumBalance).toLocaleString()}</span>
                                </div>
                            )}
                            {product.isShareCapital && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Type</span>
                                    <span className="font-medium text-primary-600">Share Capital</span>
                                </div>
                            )}
                            {product.allowWithdrawals === false && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Withdrawals</span>
                                    <span className="font-medium text-amber-600">Restricted</span>
                                </div>
                            )}
                        </>
                    )}
                    {isLoan && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Interest</span>
                                <span className="font-medium">{product.interestRate}%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Multiplier</span>
                                <span className="font-medium text-primary-600 font-bold">{product.savingsMultiplier}x Savings</span>
                            </div>
                        </>
                    )}
                    {isInsurance && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Premium</span>
                                <span className="font-medium">P {Number(product.monthlyPremium || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Coverage</span>
                                <span className="font-medium">P {Number(product.coverageAmount || 0).toLocaleString()}</span>
                            </div>
                        </>
                    )}
                    {isMerchandise && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Retail Price</span>
                                <span className="font-medium">P {Number(product.retailPrice || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Stock</span>
                                <span className="font-medium">{product.stockQuantity || 0} units</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex gap-2">
                    <button className="flex-1 py-2 text-primary-600 text-sm font-semibold border border-primary-100 rounded-lg hover:bg-primary-50 transition-all">
                        Edit
                    </button>
                    {product.flyerUrl && (
                        <a
                            href={product.flyerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-primary-600 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all"
                            title="View Flyer"
                        >
                            📄
                        </a>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Product Factory</h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">Design and deploy financial products with custom rules and multipliers.</p>
                </div>
                <button
                    onClick={() => setShowSelectionModal(true)}
                    className="px-8 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-xl shadow-primary-100 transition-all hover:bg-primary-700 active:scale-95 flex items-center gap-2"
                >
                    <span className="text-xl">+</span>
                    New Product
                </button>
            </div>

            {(['savings', 'loan', 'insurance', 'merchandise'] as const).map((type) => (
                <div key={type} className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 capitalize">
                        <span className={`w-2.5 h-2.5 rounded-full ${type === 'savings' ? 'bg-success-500' :
                            type === 'loan' ? 'bg-primary-500' :
                                type === 'insurance' ? 'bg-blue-500' :
                                    'bg-amber-500'
                            }`}></span>
                        {type} Products
                        <span className="text-xs font-medium text-gray-400 ml-2 bg-gray-100 px-2 py-0.5 rounded-full">
                            {products[type].length} Total
                        </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products[type].map((product: any) => renderCard(type, product))}
                        {products[type].length === 0 && !loading && (
                            <div className="col-span-full py-12 text-center bg-white border-2 border-dashed border-gray-100 rounded-2xl">
                                <p className="text-gray-400 text-sm font-medium">No {type} products defined yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Type Selection Modal */}
            {showSelectionModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">Create New Product</h3>
                                <p className="text-gray-500 font-medium mt-1">Select the category of the financial product you want to create.</p>
                            </div>
                            <button onClick={() => setShowSelectionModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>

                        <div className="p-8 grid grid-cols-2 gap-4">
                            {[
                                { type: 'savings', icon: '💰', title: 'Savings', desc: 'Deposit & share accounts', color: 'success' },
                                { type: 'loan', icon: '💸', title: 'Loan', desc: 'Credit & multiplier rules', color: 'primary' },
                                { type: 'insurance', icon: '🛡️', title: 'Insurance', desc: 'Coverage & premiums', color: 'blue' },
                                { type: 'merchandise', icon: '📦', title: 'Merchandise', desc: 'Assets & hire-purchase', color: 'amber' },
                            ].map((item) => (
                                <button
                                    key={item.type}
                                    onClick={() => {
                                        setShowSelectionModal(false);
                                        router.push(`/admin/settings/products/new/${item.type}`);
                                    }}
                                    className="group p-6 rounded-2xl border-2 border-gray-50 hover:border-primary-100 hover:bg-primary-50/10 transition-all text-left space-y-3"
                                >
                                    <span className="text-3xl block">{item.icon}</span>
                                    <div>
                                        <h4 className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{item.title}</h4>
                                        <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

