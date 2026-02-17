'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DirectorStats {
    pendingApprovals: number;
    pendingAppeals: number;
    totalRegistered: number;
    policyAnomalies: number;
}

export default function DirectorDashboard() {
    const [stats, setStats] = useState<DirectorStats>({
        pendingApprovals: 0,
        pendingAppeals: 0,
        totalRegistered: 0,
        policyAnomalies: 2
    });
    const [loading, setLoading] = useState(true);
    const [pendingApps, setPendingApps] = useState<any[]>([]);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch applications pending decision
                const resApps = await fetch('/api/registration/applications?status=pending_decision');
                const apps = resApps.ok ? await resApps.json() : [];

                // Fetch appeals
                const resAppeals = await fetch('/api/registration/appeals');
                const appeals = resAppeals.ok ? await resAppeals.json() : [];

                setPendingApps(apps);
                setStats(prev => ({
                    ...prev,
                    pendingApprovals: apps.length,
                    pendingAppeals: appeals.length,
                }));
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
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-indigo-800 tracking-tight">
                    Director Oversight
                </h1>
                <p className="text-gray-500 mt-2 text-lg">Strategic management and final executive approvals.</p>
            </header>

            {/* Critical Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 border-l-4 border-primary-500 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">⚖️</div>
                    <div className="text-xs font-bold text-primary-700 uppercase tracking-widest">Pending Approvals</div>
                    <div className="text-4xl font-black text-gray-900 mt-2">{stats.pendingApprovals}</div>
                    <div className="mt-2 text-xs text-primary-600 font-semibold cursor-pointer hover:underline">View high-priority →</div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-warning-500 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">⚖️</div>
                    <div className="text-xs font-bold text-warning-700 uppercase tracking-widest">Active Appeals</div>
                    <div className="text-4xl font-black text-gray-900 mt-2">{stats.pendingAppeals}</div>
                    <div className="mt-2 text-xs text-warning-600 font-semibold cursor-pointer hover:underline">Review cases →</div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-secondary-500 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">📈</div>
                    <div className="text-xs font-bold text-secondary-700 uppercase tracking-widest">Policy Alerts</div>
                    <div className="text-4xl font-black text-gray-900 mt-2">{stats.policyAnomalies}</div>
                    <div className="mt-2 text-xs text-secondary-600 font-semibold cursor-pointer hover:underline">Analyze trends →</div>
                </div>
                <div className="glass-panel p-6 border-l-4 border-indigo-500 relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">🏛️</div>
                    <div className="text-xs font-bold text-indigo-700 uppercase tracking-widest">Registered Societies</div>
                    <div className="text-4xl font-black text-gray-900 mt-2">1,248</div>
                    <div className="mt-2 text-xs text-indigo-600 font-semibold cursor-pointer hover:underline">Open Registry →</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending High-Level Approvals */}
                <div className="glass-panel p-8" id="approvals">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="p-2 bg-primary-100 text-primary-600 rounded-lg text-sm">📝</span>
                            Critical Approvals
                        </h2>
                        <span className="text-xs font-bold px-3 py-1 bg-primary-50 text-primary-700 rounded-full">ACTION REQUIRED</span>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-20 bg-gray-100 rounded-xl"></div>
                                <div className="h-20 bg-gray-100 rounded-xl"></div>
                            </div>
                        ) : pendingApps.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 font-medium">No critical approvals pending</p>
                            </div>
                        ) : (
                            pendingApps.map(app => (
                                <div key={app.id} className="p-4 bg-white/40 hover:bg-white/60 border border-white/40 rounded-2xl transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{app.proposedName}</div>
                                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-gray-200 rounded text-[10px] font-bold uppercase">{app.applicationType.replace('_', ' ')}</span>
                                                <span>•</span>
                                                <span>Submitted {new Date(app.submittedAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/director/approvals/${app.id}`}
                                            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20 hover:scale-105 transition-transform"
                                        >
                                            Finalize
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Strategic Shortcuts */}
                <div className="space-y-6">
                    <div className="glass-panel p-8 bg-gradient-to-br from-gray-900 to-indigo-950 text-white border-0">
                        <h2 className="text-2xl font-bold mb-4">Strategic Tools</h2>
                        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                            Access high-level analytics and policy management tools to ensure the cooperative sector aligns with national development goals.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/director/strategic" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-center">
                                <div className="text-2xl mb-2">📊</div>
                                <div className="font-bold text-sm">Sector Analysis</div>
                            </Link>
                            <Link href="/director/policy" className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-center">
                                <div className="text-2xl mb-2">📜</div>
                                <div className="font-bold text-sm">Policy Manager</div>
                            </Link>
                        </div>
                    </div>

                    <div className="glass-panel p-8">
                        <h2 className="text-xl font-bold mb-4">System Health</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <div className="flex-1 text-sm font-medium text-gray-700">Registration Pipeline</div>
                                <div className="text-xs font-bold text-green-600">OPTIMAL</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <div className="flex-1 text-sm font-medium text-gray-700">Appeal Processing</div>
                                <div className="text-xs font-bold text-green-600">ON TRACK</div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-2 h-2 rounded-full bg-warning-500"></div>
                                <div className="flex-1 text-sm font-medium text-gray-700">Digital Signatures</div>
                                <div className="text-xs font-bold text-warning-600">ATTENTION</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
