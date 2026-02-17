'use client';

import { useState } from 'react';

const POLICIES = [
    { id: 1, title: 'Minimum Membership Requirements', lastUpdated: '2025-12-01', status: 'Active', category: 'Registration' },
    { id: 2, title: 'Security Vetting Standards', lastUpdated: '2026-01-15', status: 'Under Review', category: 'Security' },
    { id: 3, title: 'Religious Society Fee Structure', lastUpdated: '2025-06-20', status: 'Active', category: 'Finance' },
    { id: 4, title: 'Cooperative Governance Principles', lastUpdated: '2026-02-10', status: 'Active', category: 'Governance' },
];

export default function PolicyOversight() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-indigo-800 tracking-tight">
                        Policy Oversight
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Manage and monitor regulatory frameworks.</p>
                </div>
                <button className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-500/20 hover:scale-105 transition-all">
                    Draft New Policy
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 bg-blue-50/30 border-blue-200">
                    <div className="text-xs font-bold text-blue-700 uppercase tracking-widest">Active Policies</div>
                    <div className="text-3xl font-black text-blue-900 mt-2">24</div>
                </div>
                <div className="glass-panel p-6 bg-amber-50/30 border-amber-200">
                    <div className="text-xs font-bold text-amber-700 uppercase tracking-widest">Pending Review</div>
                    <div className="text-3xl font-black text-amber-900 mt-2">3</div>
                </div>
                <div className="glass-panel p-6 bg-indigo-50/30 border-indigo-200">
                    <div className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Last Change</div>
                    <div className="text-sm font-bold text-indigo-900 mt-2">Feb 10, 2026</div>
                </div>
            </div>

            <div className="glass-panel overflow-hidden border-0 shadow-xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-900 text-white">
                            <th className="p-5 font-bold uppercase text-xs tracking-widest">Policy Title</th>
                            <th className="p-5 font-bold uppercase text-xs tracking-widest">Category</th>
                            <th className="p-5 font-bold uppercase text-xs tracking-widest">Last Updated</th>
                            <th className="p-5 font-bold uppercase text-xs tracking-widest">Status</th>
                            <th className="p-5 font-bold uppercase text-xs tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {POLICIES.map((policy) => (
                            <tr key={policy.id} className="hover:bg-primary-50/30 transition-colors group">
                                <td className="p-5">
                                    <div className="font-bold text-gray-900">{policy.title}</div>
                                    <div className="text-xs text-gray-400 mt-1">ID: POL-00{policy.id}</div>
                                </td>
                                <td className="p-5">
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">{policy.category}</span>
                                </td>
                                <td className="p-5 text-sm text-gray-500 font-medium">{policy.lastUpdated}</td>
                                <td className="p-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${policy.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {policy.status}
                                    </span>
                                </td>
                                <td className="p-5">
                                    <button className="text-primary-600 font-bold text-sm hover:underline">Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="glass-panel p-8 border-dashed border-2 bg-gray-50/50">
                <h3 className="text-lg font-bold mb-4">Policy Impact Analysis</h3>
                <div className="h-48 flex items-end gap-4">
                    {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-primary-200 rounded-t-lg relative group transition-all hover:bg-primary-400" style={{ height: `${h}%` }}>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Impact: {h}%
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
            </div>
        </div>
    );
}
