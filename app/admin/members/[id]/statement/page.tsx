'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface StatementData {
    member: any;
    loans: any[];
    savings: any[];
    transactions: any[];
    generatedAt: string;
    generatedBy: {
        name: string;
        email: string;
    };
}

export default function MemberStatementPage() {
    const params = useParams();
    const router = useRouter();
    const memberId = params.id as string;

    const [data, setData] = useState<StatementData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStatementData() {
            try {
                const res = await fetch(`/api/admin/members/${memberId}/statement`);
                if (!res.ok) throw new Error('Failed to fetch statement data');
                const result = await res.json();
                setData(result.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchStatementData();
    }, [memberId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 text-center">
                <p className="text-danger-600 font-bold mb-4">Error: {error || 'Data not found'}</p>
                <button onClick={() => router.back()} className="btn btn-secondary">Go Back</button>
            </div>
        );
    }

    const { member, loans, savings, transactions, generatedAt, generatedBy } = data;

    return (
        <div className="min-h-screen bg-white p-8 md:p-16 max-w-5xl mx-auto font-sans text-gray-900 border border-gray-100 shadow-xl my-8 rounded-lg print:shadow-none print:my-0 print:border-none print:p-0">
            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Member
                </button>
                <button onClick={handlePrint} className="btn btn-primary flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Print Statement
                </button>
            </div>

            {/* Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-gray-900 pb-8 mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 mb-1">KIKA</h1>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Botswana SACCOS Platform</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold uppercase mb-1">Member Statement</h2>
                    <p className="text-gray-500 text-sm italic">Generated on {format(new Date(generatedAt), 'dd MMMM yyyy, HH:mm')}</p>
                </div>
            </div>

            {/* Member Info Section */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-1">Member Information</h3>
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-gray-900 leading-tight">
                            {member.firstName} {member.middleName ? member.middleName + ' ' : ''}{member.lastName}
                        </p>
                        <p className="text-gray-600 text-sm">Member No: <span className="font-mono font-bold">{member.memberNumber}</span></p>
                        <p className="text-gray-600 text-sm">ID No: <span className="font-bold">{member.nationalId}</span></p>
                        <p className="text-gray-600 text-sm italic">{member.email}</p>
                    </div>
                </div>
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-1">Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Total Savings:</span>
                            <span className="font-bold">P {savings.reduce((s, a) => s + Number(a.balance), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Loan Balance:</span>
                            <span className="font-bold text-danger-600">P {loans.reduce((s, l) => s + Number(l.outstandingBalance), 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Share Capital:</span>
                            <span className="font-bold text-success-600">P {Number(member.shareCapital).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Details */}
            <div className="mb-12">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-1">Savings Accounts</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-y border-gray-100 italic">
                            <th className="px-4 py-3 text-left font-black text-gray-600 uppercase tracking-tighter">Product Name</th>
                            <th className="px-4 py-3 text-right font-black text-gray-600 uppercase tracking-tighter">Monthly Contribution</th>
                            <th className="px-4 py-3 text-right font-black text-gray-600 uppercase tracking-tighter">Current Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {savings.map(acc => (
                            <tr key={acc.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-bold text-gray-900">{acc.product.name}</td>
                                <td className="px-4 py-3 text-right text-gray-500">P {Number(acc.monthlyContribution).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-black text-gray-900">P {Number(acc.balance).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Loan Details */}
            <div className="mb-12">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-1">Active Loans</h3>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-y border-gray-100 italic">
                            <th className="px-4 py-3 text-left font-black text-gray-600 uppercase tracking-tighter">Loan Number</th>
                            <th className="px-4 py-3 text-left font-black text-gray-600 uppercase tracking-tighter">Product</th>
                            <th className="px-4 py-3 text-right font-black text-gray-600 uppercase tracking-tighter">Principal</th>
                            <th className="px-4 py-3 text-right font-black text-gray-600 uppercase tracking-tighter">Outstanding</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                        {loans.filter(l => ['active', 'disbursed'].includes(l.status.toLowerCase())).map(loan => (
                            <tr key={loan.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-mono text-xs font-bold">{loan.loanNumber}</td>
                                <td className="px-4 py-3">{loan.product.name}</td>
                                <td className="px-4 py-3 text-right font-medium">P {Number(loan.principalAmount).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right font-black text-danger-600">P {Number(loan.outstandingBalance).toLocaleString()}</td>
                            </tr>
                        ))}
                        {loans.filter(l => ['active', 'disbursed'].includes(l.status.toLowerCase())).length === 0 && (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic font-medium">No active loans found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Transaction History */}
            <div className="mb-12">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 border-b pb-1">Recent Transactions (Last 100)</h3>
                <table className="w-full text-xs">
                    <thead>
                        <tr className="bg-gray-50 border-y border-gray-100 italic">
                            <th className="px-4 py-3 text-left font-black text-gray-600 uppercase tracking-tighter">Date</th>
                            <th className="px-4 py-3 text-left font-black text-gray-600 uppercase tracking-tighter">Description</th>
                            <th className="px-4 py-3 text-left font-black text-gray-600 uppercase tracking-tighter">Type</th>
                            <th className="px-4 py-3 text-right font-black text-gray-600 uppercase tracking-tighter">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                        {transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 font-medium">{format(new Date(tx.createdAt), 'dd/MM/yyyy')}</td>
                                <td className="px-4 py-3 font-bold text-gray-900">{tx.description}</td>
                                <td className="px-4 py-3 uppercase font-medium text-gray-500">{tx.transactionType.replace('_', ' ')}</td>
                                <td className={`px-4 py-3 text-right font-black ${['withdrawal', 'loan_repayment', 'fee', 'insurance_premium'].includes(tx.transactionType.toLowerCase()) ? 'text-danger-600' : 'text-success-600'}`}>
                                    {['withdrawal', 'loan_repayment', 'fee', 'insurance_premium'].includes(tx.transactionType.toLowerCase()) ? '-' : '+'} P {Number(tx.amount).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic font-medium">No transaction history found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-gray-100 text-[10px] text-gray-400 italic">
                <div className="flex justify-between items-end">
                    <div>
                        <p>This is a computer-generated document and does not require a signature.</p>
                        <p className="mt-1 font-bold">KIKA SACCOS Management System</p>
                    </div>
                    <div className="text-right">
                        <p>Authorized Admin: <span className="text-gray-600 font-bold">{generatedBy.name}</span></p>
                        <p>Identifier: {generatedBy.email}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
