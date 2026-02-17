'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';

interface SavingProduct {
    id: string;
    name: string;
    code: string;
    interestRate: number;
    description: string;
    minMonthlyContribution: number;
}

interface SavingAccount {
    id: string;
    balance: number;
    monthlyContribution: number;
    isActive: boolean;
    product: {
        id: string;
        name: string;
        code: string;
        interestRate: number;
        isShareCapital: boolean;
    };
}

export default function MemberSavingsPage() {
    const [accounts, setAccounts] = useState<SavingAccount[]>([]);
    const [availableProducts, setAvailableProducts] = useState<SavingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Update Contribution Modal state
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<SavingAccount | null>(null);
    const [newAmount, setNewAmount] = useState<number>(0);
    const [isUpdating, setIsUpdating] = useState(false);

    // Apply Product Modal state
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<SavingProduct | null>(null);
    const [initialContribution, setInitialContribution] = useState<number>(0);
    const [isApplying, setIsApplying] = useState(false);

    const fetchData = async () => {
        try {
            const [accRes, prodRes] = await Promise.all([
                fetch('/api/member/savings'),
                fetch('/api/member/savings/products')
            ]);

            if (!accRes.ok || !prodRes.ok) throw new Error('Failed to fetch data');

            const accData = await accRes.json();
            const prodData = await prodRes.json();

            setAccounts(accData);

            // Filter out products member already has
            const existingProductIds = accData.map((a: SavingAccount) => a.product.id);
            setAvailableProducts(prodData.filter((p: SavingProduct) => !existingProductIds.includes(p.id)));

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateContribution = async () => {
        if (!selectedAccount) return;
        setIsUpdating(true);
        try {
            const response = await fetch('/api/member/savings/contribution', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: selectedAccount.id,
                    newAmount: Number(newAmount)
                })
            });

            if (!response.ok) throw new Error('Update failed');
            alert('Contribution updated successfully!');
            setIsUpdateModalOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleApply = async () => {
        if (!selectedProduct) return;
        setIsApplying(true);
        try {
            const response = await fetch('/api/member/savings/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    initialMonthlyContribution: Number(initialContribution)
                })
            });

            if (!response.ok) throw new Error('Application failed');
            alert('New account opened successfully!');
            setIsApplyModalOpen(false);
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsApplying(false);
        }
    };

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    const totalMonthly = accounts.reduce((sum, acc) => sum + Number(acc.monthlyContribution), 0);

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Savings</h1>
                        <p className="text-gray-600">Overview of your savings accounts and contributions</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Total Savings</div>
                        <div className="text-4xl font-black text-primary-600">P {totalBalance.toLocaleString()}</div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                        {[1, 2].map(i => <div key={i} className="card h-48 bg-gray-100"></div>)}
                    </div>
                ) : error ? (
                    <div className="card p-6 bg-danger-50 text-danger-700">{error}</div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {accounts.map(account => (
                                <div key={account.id} className="card overflow-hidden group hover:shadow-xl transition-all duration-300">
                                    <div className={`p-1 ${account.product.isShareCapital ? 'bg-indigo-500' : 'bg-success-500'}`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{account.product.code}</div>
                                                <h3 className="text-xl font-bold text-gray-900">{account.product.name}</h3>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-bold ${account.isActive ? 'bg-success-100 text-success-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {account.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-sm text-gray-500 mb-1">Balance</div>
                                                <div className="text-3xl font-bold text-gray-900">P {Number(account.balance).toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-500 mb-1">Interest Rate</div>
                                                <div className="text-lg font-semibold text-primary-600">{account.product.interestRate}% p.a.</div>
                                            </div>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center text-sm">
                                            <span className="text-gray-600 font-medium">Monthly Contribution:</span>
                                            <span className="font-bold text-gray-900">P {Number(account.monthlyContribution).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="card p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white mb-12">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Monthly Savings Summary</h3>
                                    <p className="text-primary-100">Total amount deducted from your salary for savings</p>
                                </div>
                                <div className="text-center md:text-right">
                                    <div className="text-4xl font-bold">P {totalMonthly.toLocaleString()}</div>
                                    <div className="text-sm text-primary-200 mt-1">Next deduction scheduled: Mar 25</div>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedAccount(accounts[0]);
                                        setNewAmount(accounts[0]?.monthlyContribution || 0);
                                        setIsUpdateModalOpen(true);
                                    }}
                                    className="btn bg-white text-primary-700 hover:bg-primary-50 px-8 py-3 font-bold rounded-xl shadow-lg transition-all"
                                >
                                    Update My Contributions
                                </button>
                            </div>
                        </div>

                        {availableProducts.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore More Savings Options</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {availableProducts.map(product => (
                                        <div key={product.id} className="card p-6 border-2 border-transparent hover:border-primary-200 transition-all flex flex-col">
                                            <div className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">{product.code}</div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                                            <p className="text-sm text-gray-500 flex-grow mb-6 line-clamp-3">{product.description}</p>
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <div className="text-[10px] uppercase font-bold text-gray-400">Yield</div>
                                                    <div className="text-xl font-black text-gray-900">{product.interestRate}% <span className="text-xs font-medium text-gray-400">p.a.</span></div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] uppercase font-bold text-gray-400">Min. Save</div>
                                                    <div className="text-xl font-black text-gray-900">P {product.minMonthlyContribution}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setInitialContribution(product.minMonthlyContribution);
                                                    setIsApplyModalOpen(true);
                                                }}
                                                className="w-full py-2 bg-gray-50 hover:bg-primary-600 hover:text-white text-gray-900 font-bold rounded-lg transition-all border border-gray-100 hover:border-primary-600"
                                            >
                                                Start Saving
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Contribution Modal */}
                {isUpdateModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-xl font-bold text-gray-900">Update Contribution</h2>
                                <p className="text-sm text-gray-500">How much would you like to save monthly?</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Account</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-bold text-gray-700"
                                        value={selectedAccount?.id}
                                        onChange={(e) => {
                                            const acc = accounts.find(a => a.id === e.target.value);
                                            setSelectedAccount(acc || null);
                                            setNewAmount(acc?.monthlyContribution || 0);
                                        }}
                                    >
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.product.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Monthly saving (P)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-black text-2xl text-gray-900"
                                        value={newAmount}
                                        onChange={(e) => setNewAmount(Number(e.target.value))}
                                    />
                                    <p className="text-[10px] text-primary-500 mt-2 font-bold italic">Note: Changes will apply to the next deduction cycle.</p>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex gap-4">
                                <button onClick={() => setIsUpdateModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                                <button
                                    onClick={handleUpdateContribution}
                                    disabled={isUpdating}
                                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50"
                                >
                                    {isUpdating ? 'Saving...' : 'Confirm Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Apply Modal */}
                {isApplyModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 bg-primary-600 text-white">
                                <h2 className="text-xl font-bold">Open Savings Account</h2>
                                <p className="text-sm text-primary-100">{selectedProduct?.name}</p>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="bg-primary-50 p-4 rounded-xl">
                                    <div className="text-[10px] font-black text-primary-400 uppercase mb-1">Account Benefits</div>
                                    <div className="text-sm font-bold text-primary-900">✨ Earn {selectedProduct?.interestRate}% interest annually</div>
                                    <div className="text-sm font-bold text-primary-900 mt-1">✨ Minimum save: P {selectedProduct?.minMonthlyContribution}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-gray-400 uppercase mb-1 block">Monthly Contribution (P)</label>
                                    <input
                                        type="number"
                                        min={selectedProduct?.minMonthlyContribution}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-black text-2xl text-gray-900"
                                        value={initialContribution}
                                        onChange={(e) => setInitialContribution(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex gap-4">
                                <button onClick={() => setIsApplyModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 hover:text-gray-700">Cancel</button>
                                <button
                                    onClick={handleApply}
                                    disabled={isApplying || initialContribution < (selectedProduct?.minMonthlyContribution || 0)}
                                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-50"
                                >
                                    {isApplying ? 'Processing...' : 'Apply Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
