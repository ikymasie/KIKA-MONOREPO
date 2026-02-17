'use client';

import { useState } from 'react';

const SECTOR_POLICIES = [
    { id: 1, title: 'National Cooperative Strategy 2026', scope: 'National', status: 'Active', impact: 'High', date: 'Jan 15, 2026' },
    { id: 2, title: 'SACCOS Prudential Guidelines v2', scope: 'Financial', status: 'Active', impact: 'Medium', date: 'Feb 01, 2026' },
    { id: 3, title: 'Youth-Led Society Incentives', scope: 'Targeted', status: 'Drafting', impact: 'High', date: 'Feb 10, 2026' },
    { id: 4, title: 'Agricultural Cooperative Reform', scope: 'Sectoral', status: 'Under Review', impact: 'Critical', date: 'Feb 12, 2026' },
];

export default function PolicyTools() {
    return (
        <div className="space-y-8 animate-fade-in-up">
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-900 tracking-tight">
                        Policy Decision Tools
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">Strategic steering and regulatory framework management.</p>
                </div>
                <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-2xl hover:bg-indigo-700 transition-all hover:-translate-y-1 active:scale-95">
                    Propose New Policy
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-panel p-8 bg-indigo-50/50 border-indigo-100 flex flex-col gap-4">
                    <div className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Active Frameworks</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-indigo-900 tracking-tighter">12</span>
                        <span className="text-xs font-bold text-indigo-600">+2 this quarter</span>
                    </div>
                </div>
                <div className="glass-panel p-8 bg-purple-50/50 border-purple-100 flex flex-col gap-4">
                    <div className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Pending Directives</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-purple-900 tracking-tighter">4</span>
                        <span className="text-xs font-bold text-purple-600">Action Required</span>
                    </div>
                </div>
                <div className="glass-panel p-8 bg-emerald-50/50 border-emerald-100 flex flex-col gap-4">
                    <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Economic Impact</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-emerald-900 tracking-tighter">P12.4B</span>
                        <span className="text-xs font-bold text-emerald-600">Sector Value</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-panel overflow-hidden border-0 shadow-2xl">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-black text-gray-900">Regulatory Inventory</h2>
                        <div className="flex gap-2">
                            <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold text-gray-500">SORT BY DATE</span>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                <th className="p-6">Strategy/Directive</th>
                                <th className="p-6">Scope</th>
                                <th className="p-6">Impact</th>
                                <th className="p-6">Status</th>
                                <th className="p-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 font-bold">
                            {SECTOR_POLICIES.map((p) => (
                                <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="p-6">
                                        <div className="text-gray-900">{p.title}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">Last Modified: {p.date}</div>
                                    </td>
                                    <td className="p-6">
                                        <span className="text-[10px] bg-gray-100 px-3 py-1 rounded-full text-gray-600">{p.scope}</span>
                                    </td>
                                    <td className="p-6">
                                        <span className={`text-[10px] font-black italic ${p.impact === 'Critical' ? 'text-red-600' : 'text-indigo-600'}`}>{p.impact}</span>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${p.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                                            <span className="text-xs">{p.status}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button className="text-indigo-600 text-sm hover:underline font-black">Open</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-8 bg-gray-900 text-white">
                        <h3 className="text-lg font-black mb-6">Impact Projection</h3>
                        <div className="space-y-8">
                            {[
                                { label: 'Cooperative Inclusivity', value: 87 },
                                { label: 'Financial Resilience', value: 64 },
                                { label: 'Rural Development', value: 92 },
                            ].map((stat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black tracking-widest text-indigo-300">
                                        <span>{stat.label.toUpperCase()}</span>
                                        <span>{stat.value}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                                            style={{ width: `${stat.value}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-8 border-dashed border-2 flex flex-col items-center justify-center text-center gap-4">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-2xl">📊</div>
                        <div>
                            <h4 className="font-bold text-gray-900">Advanced Analytics</h4>
                            <p className="text-xs text-gray-400 mt-1">Generate deep-sector reports based on current regulatory data.</p>
                        </div>
                        <button className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-black hover:bg-gray-50 transition-colors">Run Sector Report</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
