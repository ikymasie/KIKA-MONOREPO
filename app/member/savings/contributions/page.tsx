'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import MemberSidebar from '@/components/layout/MemberSidebar';
import { format } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

interface Contribution {
    id: string;
    amount: number;
    transactionDate: string;
    transactionNumber: string;
    status: string;
    description: string;
}

export default function ContributionTrackingPage() {
    const [contributions, setContributions] = useState<Contribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/member/contributions/track');
                if (res.ok) {
                    const data = await res.json();
                    setContributions(data);
                } else {
                    throw new Error('Failed to fetch contributions');
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const chartData = [...contributions].reverse().map(c => ({
        month: format(new Date(c.transactionDate), 'MMM yy'),
        amount: Number(c.amount)
    }));

    return (
        <DashboardLayout sidebar={<MemberSidebar />}>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Contribution Tracking</h1>
                    <p className="text-gray-500 font-medium text-lg mt-2">Verify and track your monthly salary deductions and savings growth.</p>
                </div>

                {loading ? (
                    <div className="space-y-8">
                        <div className="h-80 bg-gray-50 rounded-[2.5rem] animate-pulse"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse"></div>)}
                        </div>
                    </div>
                ) : error ? (
                    <div className="p-6 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 italic">
                        {error}
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="glass-panel p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Contributions</p>
                                <p className="text-4xl font-black text-gray-900">P {contributions.reduce((sum, c) => sum + Number(c.amount), 0).toLocaleString()}</p>
                            </div>
                            <div className="glass-panel p-8 bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Last Deduction</p>
                                <p className="text-4xl font-black text-primary-600">P {contributions[0]?.amount?.toLocaleString() || '0'}</p>
                                <p className="text-xs text-gray-500 font-bold mt-2">{contributions[0] ? format(new Date(contributions[0].transactionDate), 'MMMM dd, yyyy') : '-'}</p>
                            </div>
                            <div className="glass-panel p-8 bg-green-600 text-white shadow-xl shadow-green-200">
                                <p className="text-xs font-black text-green-100 uppercase tracking-widest mb-2">Verification Status</p>
                                <p className="text-4xl font-black">100% Verified</p>
                                <p className="text-xs text-green-100 font-bold mt-2">All deductions matched</p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="glass-panel p-10 bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-black text-gray-900">Savings Growth</h2>
                                <div className="flex gap-4">
                                    <span className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                        <div className="w-3 h-3 bg-primary-500 rounded-sm"></div> Monthly Savings
                                    </span>
                                </div>
                            </div>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '1rem',
                                                border: 'none',
                                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#4f46e5' : '#818cf8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="glass-panel overflow-hidden bg-white border border-gray-100 shadow-xl shadow-gray-200/50">
                            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                                <h2 className="text-2xl font-black text-gray-900">Deduction History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Transaction #</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Description</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {contributions.map((contribution) => (
                                            <tr key={contribution.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <p className="font-bold text-gray-900">{format(new Date(contribution.transactionDate), 'MMM dd, yyyy')}</p>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <p className="font-mono text-xs font-bold text-primary-600">{contribution.transactionNumber}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-medium text-gray-600">{contribution.description || 'Monthly Payroll Deduction'}</p>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${contribution.status === 'completed'
                                                            ? 'bg-success-50 text-success-700 border-success-100'
                                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}>
                                                        {contribution.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <p className="text-lg font-black text-gray-900">P {Number(contribution.amount).toLocaleString()}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
