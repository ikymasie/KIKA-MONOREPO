'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MinisterStats {
    pendingAppeals: number;
    pendingFinalApprovals: number;
    totalSocieties: number;
    regulatoryAlerts: number;
}

export default function MinisterDashboard() {
    const [stats, setStats] = useState<MinisterStats>({
        pendingAppeals: 0,
        pendingFinalApprovals: 0,
        totalSocieties: 1248,
        regulatoryAlerts: 3
    });
    const [loading, setLoading] = useState(true);
    const [priorityItems, setPriorityItems] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch appeals
                const resAppeals = await fetch('/api/registration/minister/appeals');
                const appeals = resAppeals.ok ? await resAppeals.json() : [];

                // Fetch applications pending decision (final authority)
                const resApprovals = await fetch('/api/registration/applications?status=pending_decision');
                const approvals = resApprovals.ok ? await resApprovals.json() : [];

                setStats(prev => ({
                    ...prev,
                    pendingAppeals: appeals.length,
                    pendingFinalApprovals: approvals.length,
                }));

                const combinedPriority = [
                    ...appeals.map((a: any) => ({ ...a, priorityType: 'Appeal' })),
                    ...approvals.slice(0, 3).map((a: any) => ({ ...a, priorityType: 'Final Approval' }))
                ];
                setPriorityItems(combinedPriority);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <header>
                <div className="flex items-center gap-3">
                    <span className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl text-2xl shadow-inner">🏛️</span>
                    <div>
                        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-900 tracking-tight">
                            Ministerial Oversight Cabinet
                        </h1>
                        <p className="text-gray-500 mt-1 text-lg font-medium">Strategic adjudication and final executive authority.</p>
                    </div>
                </div>
            </header>

            {/* Strategic Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 border-l-4 border-indigo-600 relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
                    <div className="text-xs font-black text-indigo-800 uppercase tracking-widest opacity-70">Pending Appeals</div>
                    <div className="text-4xl font-black text-gray-900 mt-2">{stats.pendingAppeals}</div>
                    <div className="mt-4 flex items-center justify-between">
                        <Link href="/minister/appeals" className="text-xs font-bold text-indigo-600 hover:underline">Adjudicate Now →</Link>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold">HIGH PRIORITY</span>
                    </div>
                </div>

                <div className="glass-panel p-6 border-l-4 border-purple-600 relative overflow-hidden group hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                    <div className="text-xs font-black text-purple-800 uppercase tracking-widest opacity-70">Final Approvals</div>
                    <div className="text-4xl font-black text-gray-900 mt-2">{stats.pendingFinalApprovals}</div>
                    <div className="mt-4 flex items-center justify-between">
                        <Link href="/minister/approvals" className="text-xs font-bold text-purple-600 hover:underline">Review Queue →</Link>
                        <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded-full font-bold">REQUIRED</span>
                    </div>
                </div>

                <div className="glass-panel p-6 border-l-4 border-emerald-600 relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300">
                    <div className="text-xs font-black text-emerald-800 uppercase tracking-widest opacity-70">Total Societies</div>
                    <div className="text-4xl font-black text-gray-900 mt-2">{stats.totalSocieties.toLocaleString()}</div>
                    <div className="mt-4">
                        <Link href="/regulator/registry" className="text-xs font-bold text-emerald-600 hover:underline">Official Registry →</Link>
                    </div>
                </div>

                <div className="glass-panel p-6 border-l-4 border-pink-600 relative overflow-hidden group hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300">
                    <div className="text-xs font-black text-pink-800 uppercase tracking-widest opacity-70">Policy Alerts</div>
                    <div className="text-4xl font-black text-gray-900 mt-2">{stats.regulatoryAlerts}</div>
                    <div className="mt-4 flex items-center justify-between">
                        <Link href="/minister/policy" className="text-xs font-bold text-pink-600 hover:underline">Assess Impact →</Link>
                        <span className="text-[10px] bg-pink-50 text-pink-700 px-2 py-1 rounded-full font-bold">ACTION</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Priority Workflow */}
                <div className="lg:col-span-2 glass-panel p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                            Priority Action Queue
                        </h2>
                        <button className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">View All Actions</button>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse"></div>
                            ))
                        ) : priorityItems.length === 0 ? (
                            <div className="text-center py-16 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                                <span className="text-4xl mb-4 block">✨</span>
                                <p className="text-gray-400 font-bold">Cabinet queue is currently clear.</p>
                            </div>
                        ) : (
                            priorityItems.map((item, idx) => (
                                <div key={item.id} className="p-5 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4 items-center">
                                            <div className={`p-3 rounded-xl font-bold text-xs ${item.priorityType === 'Appeal' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                {item.priorityType}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900">{item.proposedName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">Submitted by {item.primaryContactName} • {new Date(item.updatedAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <Link
                                            href={item.priorityType === 'Appeal' ? `/minister/appeals/${item.id}` : `/minister/approvals/${item.id}`}
                                            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-gray-200"
                                        >
                                            Process
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* System Insights */}
                <div className="space-y-6">
                    <div className="glass-panel p-8 bg-gradient-to-br from-indigo-900 to-purple-950 text-white border-0 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <span>📡</span> Sector Intelligence
                        </h2>
                        <p className="text-indigo-200 text-sm leading-relaxed mb-6">
                            Real-time monitoring of cooperative society health and regulatory compliance across all provinces.
                        </p>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-indigo-300">COMPLIANCE RATE</span>
                                <span className="text-lg font-black italic">94.2%</span>
                            </div>
                            <div className="w-full h-2 bg-indigo-950 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400 w-[94.2%]"></div>
                            </div>
                            <div className="pt-4 grid grid-cols-2 gap-3">
                                <div className="p-3 bg-white/10 rounded-xl">
                                    <div className="text-[10px] text-indigo-300 font-bold">NEW APPS</div>
                                    <div className="text-xl font-black">+12</div>
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl">
                                    <div className="text-[10px] text-indigo-300 font-bold">REVOKED</div>
                                    <div className="text-xl font-black">2</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 border-indigo-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h2>
                        <div className="grid grid-cols-1 gap-2">
                            <Link href="/minister/policy" className="p-3 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-3 group">
                                <span className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">📜</span>
                                <span className="text-sm font-bold text-gray-700">Policy Frameworks</span>
                            </Link>
                            <Link href="/regulator/registry" className="p-3 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-3 group">
                                <span className="bg-white p-2 rounded-lg shadow-sm group-hover:scale-110 transition-transform">📒</span>
                                <span className="text-sm font-bold text-gray-700">Digital Registry</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
