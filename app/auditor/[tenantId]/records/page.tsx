'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Account {
    id: string;
    code: string;
    name: string;
    accountType: string;
    balance: number;
}

interface Transaction {
    id: string;
    createdAt: string;
    description: string;
    entryType: 'debit' | 'credit';
    amount: number;
    account: {
        name: string;
        code: string;
    };
}

export default function AuditorRecordsPage() {
    const params = useParams();
    const router = useRouter();
    const requestId = params.tenantId as string; // We use requestId as the param for simplicity in routing logic

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'accounts' | 'ledger'>('accounts');
    const [tenantInfo, setTenantInfo] = useState<{ name: string, tenantId: string } | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // First get the request info to find the tenantId
                const reqRes = await fetch('/api/external-auditor/access-request');
                if (reqRes.ok) {
                    const requests = await reqRes.json();
                    const currentReq = requests.find((r: any) => r.id === requestId);
                    if (currentReq) {
                        setTenantInfo({ name: currentReq.tenant.name, tenantId: currentReq.tenant.id });

                        // Fetch accounts
                        const accRes = await fetch(`/api/external-auditor/${currentReq.tenant.id}/accounts`);
                        if (accRes.ok) setAccounts(await accRes.json());

                        // Fetch transactions
                        const txRes = await fetch(`/api/external-auditor/${currentReq.tenant.id}/transactions`);
                        if (txRes.ok) setTransactions(await txRes.json());
                    }
                }
            } catch (e) {
                console.error('Error fetching engagement data:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [requestId]);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading engagement data...</div>;
    if (!tenantInfo) return <div className="p-12 text-center text-danger-600 font-bold">Audit engagement not found or access expired.</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">Active Engagement</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">{tenantInfo.name}</h1>
                    <p className="text-gray-600">Financial Records & General Ledger Audit Viewer</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.push(`/auditor/${requestId}/working-papers`)} className="btn btn-outline border-emerald-200">
                        📁 Working Papers
                    </button>
                    <button onClick={() => router.push(`/auditor/${requestId}/reports`)} className="btn btn-primary shadow-emerald-200">
                        📄 Submit Report
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mb-8 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`pb-4 px-6 text-sm font-bold transition-all ${activeTab === 'accounts' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Chart of Accounts
                </button>
                <button
                    onClick={() => setActiveTab('ledger')}
                    className={`pb-4 px-6 text-sm font-bold transition-all ${activeTab === 'ledger' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    General Ledger
                </button>
            </div>

            {activeTab === 'accounts' ? (
                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Account Code</th>
                                <th className="px-6 py-4">Account Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {accounts.map((acc) => (
                                <tr key={acc.id} className="hover:bg-white/30 transition-colors">
                                    <td className="px-6 py-4 font-mono text-sm">{acc.code}</td>
                                    <td className="px-6 py-4 font-semibold text-gray-900">{acc.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium text-gray-600 uppercase">
                                            {acc.accountType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        P {Number(acc.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="glass-panel overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Account</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Debit</th>
                                <th className="px-6 py-4 text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/30 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900 text-sm">{tx.account.name}</div>
                                        <div className="text-xs text-gray-500">{tx.account.code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm italic">{tx.description}</td>
                                    <td className="px-6 py-4 text-right">
                                        {tx.entryType === 'debit' ? (
                                            <span className="font-bold text-gray-900 font-mono">P {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {tx.entryType === 'credit' ? (
                                            <span className="font-bold text-gray-900 font-mono">P {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
