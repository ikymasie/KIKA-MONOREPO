'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

interface DashboardStats {
    upcomingVisits: number;
    openInvestigations: number;
    pendingReports: number;
}

export default function FieldOfficerDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        upcomingVisits: 0,
        openInvestigations: 0,
        pendingReports: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [visitsRes, investigationsRes, reportsRes] = await Promise.all([
                    fetch('/api/regulator/field-visits?status=scheduled'),
                    fetch('/api/regulator/investigations?status=open'),
                    fetch('/api/regulator/field-visits?status=in_progress')
                ]);

                if (visitsRes.ok && investigationsRes.ok && reportsRes.ok) {
                    const visits = await visitsRes.json();
                    const investigations = await investigationsRes.json();
                    const pendingReports = await reportsRes.json();

                    setStats({
                        upcomingVisits: visits.length,
                        openInvestigations: investigations.length,
                        pendingReports: pendingReports.length,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Field Officer Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage on-site inspections, investigations, and regulatory oversight.</p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-100 text-primary-600 rounded-lg text-2xl">🚗</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Upcoming Visits</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.upcomingVisits}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-warning-100 text-warning-600 rounded-lg text-2xl">🔍</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Open Investigations</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.openInvestigations}</p>
                            </div>
                        </div>
                    </div>
                    <div className="card p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-success-100 text-success-600 rounded-lg text-2xl">📝</div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Pending Reports</p>
                                <p className="text-3xl font-bold text-gray-900">{stats.pendingReports}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Field Operations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/regulator/field-officer/visits" className="group card p-6 bg-gradient-to-br from-white to-gray-50 hover:to-primary-50 border-white/40 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                            <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform">📅</div>
                            <h3 className="font-bold text-lg mb-2 text-gray-900">Schedule Visit</h3>
                            <p className="text-sm text-gray-600">Plan and schedule on-site inspections for SACCOs.</p>
                        </Link>

                        <Link href="/regulator/field-officer/investigations" className="group card p-6 bg-gradient-to-br from-white to-gray-50 hover:to-warning-50 border-white/40 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                            <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform">🔎</div>
                            <h3 className="font-bold text-lg mb-2 text-gray-900">Start Investigation</h3>
                            <p className="text-sm text-gray-600">Initiate compliance and regulatory investigations.</p>
                        </Link>

                        <Link href="/regulator/field-officer/reports" className="group card p-6 bg-gradient-to-br from-white to-gray-50 hover:to-success-50 border-white/40 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                            <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform">📋</div>
                            <h3 className="font-bold text-lg mb-2 text-gray-900">Field Reports</h3>
                            <p className="text-sm text-gray-600">Review and submit reports for completed visits.</p>
                        </Link>
                    </div>
                </div>

                {/* Cooperative Principles Reminder */}
                <div className="card p-6 border-l-4 border-primary-500 bg-primary-50/30">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                        <span>💡</span> ICA Cooperative Principles
                    </h3>
                    <ul className="text-sm text-gray-700 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 ml-6 list-disc">
                        <li>Voluntary and Open Membership</li>
                        <li>Democratic Member Control</li>
                        <li>Member Economic Participation</li>
                        <li>Autonomy and Independence</li>
                        <li>Education, Training, and Information</li>
                        <li>Cooperation among Cooperatives</li>
                        <li>Concern for Community</li>
                    </ul>
                </div>
            </div>
        </DashboardLayout>
    );
}
