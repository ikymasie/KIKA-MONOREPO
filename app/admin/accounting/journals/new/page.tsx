'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { useRouter } from 'next/navigation';

interface Account {
    id: string;
    code: string;
    name: string;
}

interface EntryItem {
    accountId: string;
    type: 'debit' | 'credit';
    amount: number;
    description: string;
}

export default function NewJournalPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<EntryItem[]>([
        { accountId: '', type: 'debit', amount: 0, description: '' },
        { accountId: '', type: 'credit', amount: 0, description: '' }
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchAccounts() {
            const res = await fetch('/api/admin/accounting/chart-of-accounts');
            const data = await res.json();
            setAccounts(data);
        }
        fetchAccounts();
    }, []);

    const addItem = () => {
        setItems([...items, { accountId: '', type: 'debit', amount: 0, description: '' }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof EntryItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const totalDebit = items.filter(i => i.type === 'debit').reduce((sum, i) => sum + Number(i.amount), 0);
    const totalCredit = items.filter(i => i.type === 'credit').reduce((sum, i) => sum + Number(i.amount), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isBalanced) {
            alert('Journal entry must be balanced (Total Debits = Total Credits)');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/admin/accounting/journal-entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, date, items })
            });
            if (res.ok) {
                router.push('/admin/accounting/gl');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create journal entry');
            }
        } catch (error) {
            alert('Error creating journal entry');
        } finally {
            setLoading(false);
        }
    }

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Journal Entry</h1>
                    <p className="text-gray-600">Enter a manual adjustment or multi-leg transaction</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
                    <div className="card p-6 bg-white border border-gray-100 rounded-xl space-y-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Transaction Description</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="e.g. Monthly Accruals"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Entry Details</h3>
                            <div className="space-y-3">
                                {items.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-start bg-gray-50/50 p-4 rounded-xl border border-gray-100 group">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Account</label>
                                            <select
                                                required
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                                value={item.accountId}
                                                onChange={e => updateItem(index, 'accountId', e.target.value)}
                                            >
                                                <option value="">Select Account</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-32">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Type</label>
                                            <select
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                                value={item.type}
                                                onChange={e => updateItem(index, 'type', e.target.value)}
                                            >
                                                <option value="debit">DEBIT</option>
                                                <option value="credit">CREDIT</option>
                                            </select>
                                        </div>
                                        <div className="w-48">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Amount</label>
                                            <input
                                                required
                                                type="number"
                                                step="0.01"
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none"
                                                value={item.amount}
                                                onChange={e => updateItem(index, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="mt-6 p-2 text-danger-500 hover:bg-danger-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-primary-600 font-bold text-sm flex items-center gap-2 hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors"
                            >
                                + Add Line Item
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center card p-6 bg-gray-900 text-white rounded-2xl shadow-xl">
                        <div className="flex gap-12">
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Debits</div>
                                <div className="text-2xl font-bold">P {totalDebit.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Credits</div>
                                <div className="text-2xl font-bold">P {totalCredit.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="text-right">
                                {isBalanced ? (
                                    <div className="text-success-400 font-black tracking-widest uppercase flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-success-400"></span>
                                        Balanced
                                    </div>
                                ) : (
                                    <div className="text-danger-400 font-black tracking-widest uppercase flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-danger-400 animate-pulse"></span>
                                        Unbalanced: P {Math.abs(totalDebit - totalCredit).toLocaleString()}
                                    </div>
                                )}
                            </div>
                            <button
                                disabled={loading || !isBalanced}
                                type="submit"
                                className={`px-10 py-3 rounded-xl font-black uppercase tracking-widest transition-all
                                    ${loading || !isBalanced ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-primary-550 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 active:scale-95'}`}
                            >
                                {loading ? 'Posting...' : 'Post Journal Entry'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
