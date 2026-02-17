'use client';

import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RegulatorSidebar from '@/components/layout/RegulatorSidebar';

export default function RegulatorSettingsPage() {
    return (
        <DashboardLayout sidebar={<RegulatorSidebar />}>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit">Settings & Administration</h1>
                    <p className="text-gray-600">Configure platform rules, manage users, and monitor system health</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/regulator/settings/users" className="card p-8 hover:shadow-xl transition-all hover:-translate-y-1 group">
                        <div className="h-16 w-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-3xl mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            👥
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">User Management</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Manage regulator staff, government officers, and their access permissions.
                        </p>
                        <div className="mt-6 flex items-center text-primary-600 font-bold text-sm">
                            Manage Users <span>→</span>
                        </div>
                    </Link>

                    <Link href="/regulator/settings/workflows" className="card p-8 hover:shadow-xl transition-all hover:-translate-y-1 group">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            🔄
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Workflow Configuration</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Define and map application stages to specific roles and notification triggers.
                        </p>
                        <div className="mt-6 flex items-center text-indigo-600 font-bold text-sm">
                            Configure Workflows <span>→</span>
                        </div>
                    </Link>

                    <div className="card p-8 opacity-60 grayscale cursor-not-allowed">
                        <div className="h-16 w-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mb-6">
                            🛡️
                        </div>
                        <h3 className="text-xl font-bold text-gray-500 mb-2">Audit Logs</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Review system-wide activity logs and security events (Coming Soon).
                        </p>
                    </div>

                    <div className="card p-8 opacity-60 grayscale cursor-not-allowed">
                        <div className="h-16 w-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-3xl mb-6">
                            🔔
                        </div>
                        <h3 className="text-xl font-bold text-gray-500 mb-2">Notification Templates</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Manage email and SMS templates for system alerts and member updates.
                        </p>
                    </div>
                </div>

                <div className="mt-12 p-8 bg-gradient-to-br from-gray-900 to-primary-900 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-2">System Health Monitor</h3>
                            <p className="text-primary-100 opacity-80">All systems are operational. Regulatory compliance engines running normally.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-center min-w-[100px]">
                                <div className="text-xs font-bold uppercase tracking-widest opacity-60">API Status</div>
                                <div className="text-success-400 font-bold">99.9%</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-center min-w-[100px]">
                                <div className="text-xs font-bold uppercase tracking-widest opacity-60">Database</div>
                                <div className="text-success-400 font-bold">Healthy</div>
                            </div>
                        </div>
                    </div>
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -ml-16 -mb-16"></div>
                </div>
            </div>
        </DashboardLayout>
    );
}
