'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AdminSidebar from '@/components/layout/AdminSidebar';

export default function BankRecPage() {
    const [step, setStep] = useState(1);
    const [isMatching, setIsMatching] = useState(false);

    return (
        <DashboardLayout sidebar={<AdminSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Reconciliation</h1>
                    <p className="text-gray-600">Ensure internal records match bank statement balances</p>
                </div>

                {/* Progress Mini-Map */}
                <div className="flex items-center gap-4 mb-12">
                    <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>1</div>
                        <span className="text-xs font-black uppercase tracking-widest">Connect / Upload</span>
                    </div>
                    <div className="h-px w-12 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>2</div>
                        <span className="text-xs font-black uppercase tracking-widest">Match Items</span>
                    </div>
                    <div className="h-px w-12 bg-gray-200"></div>
                    <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 3 ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}>3</div>
                        <span className="text-xs font-black uppercase tracking-widest">Reconcile</span>
                    </div>
                </div>

                {step === 1 && (
                    <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="card p-12 border-2 border-dashed border-gray-200 bg-white rounded-3xl text-center group hover:border-primary-400 transition-all cursor-pointer shadow-sm hover:shadow-xl">
                            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📄</div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Bank Statement</h2>
                            <p className="text-gray-500 text-sm mb-8">Drag and drop your bank CSV or OFX file here</p>
                            <button
                                onClick={() => setStep(2)}
                                className="btn btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary-500/20"
                            >
                                Select File
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 italic text-sm text-gray-600">
                                "This module automates the comparison between your bank statements and the Cash at Bank (1000) account in the General Ledger."
                            </div>
                            <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4">
                                <div className="text-2xl">💡</div>
                                <div className="text-xs text-blue-700 font-medium">Use our standard CSV template for faster matching.</div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Matching Items (12 found)</h2>
                            <button
                                onClick={() => setIsMatching(true)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all"
                            >
                                {isMatching ? 'Running Auto-Match...' : '⚡ Run Auto-Match'}
                            </button>
                        </div>

                        <div className="card overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Bank Item</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Internal Ledger Match</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <tr className="hover:bg-primary-50/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">POS PURCHASE - VODAFONE</div>
                                            <div className="text-[10px] text-gray-400 font-mono">2026-02-15 | P 450.00</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-success-100 text-success-700 rounded text-[10px] font-black uppercase">Exact Match</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-700">MERCHANDISE PURCHASE #882</div>
                                            <div className="text-[10px] text-gray-400 font-mono">P 450.00 | GL:1200</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary-600 font-bold text-xs uppercase tracking-widest">Confirm</button>
                                        </td>
                                    </tr>
                                    <tr className="bg-warning-50/20">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">ATM WITHDRAWAL</div>
                                            <div className="text-[10px] text-gray-400 font-mono">2026-02-16 | P 2,000.00</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-warning-100 text-warning-700 rounded text-[10px] font-black uppercase">Unmatched</span>
                                        </td>
                                        <td className="px-6 py-4 italic text-gray-400 text-sm">No internal transaction found</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-indigo-600 font-bold text-xs uppercase tracking-widest">Create Entry</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button onClick={() => setStep(1)} className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Back</button>
                            <button onClick={() => setStep(3)} className="btn btn-primary px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary-500/20">Finalize Rec</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="max-w-2xl mx-auto text-center space-y-8 animate-in zoom-in duration-500">
                        <div className="text-8xl">✅</div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Reconciliation Complete</h2>
                            <p className="text-gray-600">All matched items have been confirmed and ledger balances updated.</p>
                        </div>
                        <div className="card p-8 bg-gray-50 rounded-3xl border border-gray-100 grid grid-cols-2 gap-8 text-left">
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bank Balance</div>
                                <div className="text-xl font-bold text-gray-900">P 145,200.00</div>
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ledger Balance</div>
                                <div className="text-xl font-bold text-gray-900">P 145,200.00</div>
                            </div>
                            <div className="col-span-2 pt-4 border-t border-gray-200">
                                <div className="text-[10px] font-black text-success-600 uppercase tracking-widest mb-1">Status</div>
                                <div className="text-sm font-bold text-success-700 flex items-center gap-2">
                                    Perfect Sync - No Variance
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setStep(1)}
                            className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
                        >
                            Return to Selection
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
