'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

interface Account {
    id: string;
    code: string;
    name: string;
    accountType: string;
    balance: number;
    status: string;
}

export default function COAPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'asset', description: '' });

    useEffect(() => {
        fetchAccounts();
    }, []);

    async function fetchAccounts() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/accounting/chart-of-accounts');
            const data = await res.json();
            setAccounts(data);
        } catch (error) {
            console.error('Error fetching COA:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddAccount(e: React.FormEvent) {
        e.preventDefault();
        try {
            const res = await fetch('/api/admin/accounting/chart-of-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount)
            });
            if (res.ok) {
                setShowAddModal(false);
                fetchAccounts();
                setNewAccount({ code: '', name: '', type: 'asset', description: '' });
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create account');
            }
        } catch (error) {
            alert('Error creating account');
        }
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Chart of Accounts</h1>
                        <p className="text-gray-600">The foundation of your financial structure</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary px-6 py-2 rounded-lg font-bold shadow-lg shadow-primary-500/20"
                    >
                        + Create Account
                    </button>
                </div>

                <div className="card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Code</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Balance</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 h-12 bg-gray-50/50"></td>
                                    </tr>
                                ))
                            ) : accounts.map(acc => (
                                <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 font-mono font-bold text-primary-600">{acc.code}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{acc.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-tighter
                                            ${acc.accountType === 'asset' ? 'bg-blue-100 text-blue-700' :
                                                acc.accountType === 'liability' ? 'bg-red-100 text-red-700' :
                                                    acc.accountType === 'equity' ? 'bg-green-100 text-green-700' :
                                                        acc.accountType === 'revenue' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-gray-100 text-gray-700'}`}>
                                            {acc.accountType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        P {Number(acc.balance).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-success-50 text-success-700 text-[10px] font-black uppercase">
                                            <span className="w-1.5 h-1.5 rounded-full bg-success-500"></span>
                                            {acc.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Simple Modal Placeholder */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900">Add New Account</h2>
                            </div>
                            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Code</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newAccount.code}
                                        onChange={e => setNewAccount({ ...newAccount, code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newAccount.name}
                                        onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Account Type</label>
                                    <select
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                        value={newAccount.type}
                                        onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                                    >
                                        <option value="asset">Asset</option>
                                        <option value="liability">Liability</option>
                                        <option value="equity">Equity</option>
                                        <option value="revenue">Revenue</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-2 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 rounded-lg font-bold text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all"
                                    >
                                        Create Account
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
