'use client';

import { useState, useEffect } from 'react';

export default function PolicyTable() {
    const [policies, setPolicies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/insurance/policies');
            if (res.ok) {
                const data = await res.json();
                setPolicies(data);
            }
        } catch (error) {
            console.error('Failed to fetch policies:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPolicies = policies.filter(p =>
        p.member?.fullName?.toLowerCase().includes(filter.toLowerCase()) ||
        p.policyNumber?.toLowerCase().includes(filter.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-success-50 text-success-700 border-success-100';
            case 'waiting_period': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'lapsed': return 'bg-red-50 text-red-700 border-red-100';
            default: return 'bg-gray-50 text-gray-700 border-gray-100';
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white/50">
                <div className="relative w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by member name or policy #..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary-100 outline-none font-medium text-sm transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchPolicies} className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                        🔄
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Policy #</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Member</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Premium</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Coverage</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={7} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : filteredPolicies.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">No policies found.</td>
                            </tr>
                        ) : (
                            filteredPolicies.map((policy) => (
                                <tr key={policy.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-gray-600">{policy.policyNumber}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-900">{policy.member?.fullName}</span>
                                            <span className="text-xs text-gray-500">{policy.member?.nationalId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100 uppercase">
                                            {policy.product?.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-700">P {Number(policy.monthlyPremium).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-bold text-gray-700">P {Number(policy.coverageAmount).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(policy.status)}`}>
                                            {policy.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all">
                                            👁️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
