'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-hooks';

interface NavItem {
    name: string;
    href: string;
    icon: string;
}

// DCD / General Regulator nav
const dcdNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/regulator/dashboard', icon: '📊' },
    { name: 'Registrar Workspace', href: '/regulator/registrar', icon: '⚖️' },
    { name: 'Official Registry', href: '/regulator/registry', icon: '📒' },
    { name: 'Registration', href: '/registry/dashboard', icon: '📝' },
    { name: 'Intelligence', href: '/intelligence/dashboard', icon: '🕵️‍♂️' },
    { name: 'Directory', href: '/regulator/saccos', icon: '🏢' },
    { name: 'Applications', href: '/regulator/applications', icon: '📝' },
    { name: 'Bye-laws', href: '/regulator/bylaws', icon: '📜' },
    { name: 'Certificates', href: '/regulator/certificates', icon: '🏆' },
    { name: 'Compliance', href: '/regulator/compliance', icon: '✅' },
    { name: '  → Issues', href: '/regulator/compliance/issues', icon: '📋' },
    { name: '  → KYC Verification', href: '/regulator/compliance/kyc', icon: '✓' },
    { name: '  → Bye-laws Review', href: '/regulator/compliance/byelaws', icon: '📄' },
    { name: '  → Scores', href: '/regulator/compliance/scores', icon: '📊' },
    { name: '  → Automation Rules', href: '/regulator/compliance/rules', icon: '🤖' },
    { name: '  → Thresholds', href: '/regulator/compliance/thresholds', icon: '⚙️' },
    { name: '  → Audit Schedule', href: '/regulator/compliance/audits', icon: '📅' },
    { name: 'Broadcasts', href: '/regulator/broadcasts', icon: '📢' },
    { name: 'Analysis & Reports', href: '/regulator/reporting', icon: '📈' },
    { name: 'Field Operations', href: '/regulator/field-officer', icon: '🕵️' },
    { name: '  → Visits', href: '/regulator/field-officer/visits', icon: '🚗' },
    { name: '  → Investigations', href: '/regulator/field-officer/investigations', icon: '🔍' },
    { name: '  → Reports', href: '/regulator/field-officer/reports', icon: '📝' },
    { name: 'Regulatory Alerts', href: '/regulator/alerts', icon: '⚠️' },
    { name: 'Insurance Disputes', href: '/regulator/insurance/disputes', icon: '⚖️' },
    { name: 'Settings', href: '/regulator/settings', icon: '⚙️' },
    { name: '  → Users', href: '/regulator/settings/users', icon: '👥' },
    { name: '  → Workflows', href: '/regulator/settings/workflows', icon: '🔄' },
];

// BoB Prudential Supervisor — portfolio risk, financial soundness
const bobPrudentialNav: NavItem[] = [
    { name: 'Dashboard', href: '/regulator/dashboard', icon: '📊' },
    { name: 'SACCO Directory', href: '/regulator/saccos', icon: '🏢' },
    { name: 'Prudential Reports', href: '/regulator/reporting', icon: '📈' },
    { name: 'Regulatory Alerts', href: '/regulator/alerts', icon: '⚠️' },
    { name: 'Compliance Scores', href: '/regulator/compliance/scores', icon: '🏅' },
    { name: 'Compliance Thresholds', href: '/regulator/compliance/thresholds', icon: '⚙️' },
    { name: 'Insurance Disputes', href: '/regulator/insurance/disputes', icon: '⚖️' },
];

// BoB Financial Auditor — accounting, GL, financial statements
const bobFinancialAuditorNav: NavItem[] = [
    { name: 'Dashboard', href: '/regulator/dashboard', icon: '📊' },
    { name: 'SACCO Directory', href: '/regulator/saccos', icon: '🏢' },
    { name: 'Financial Reports', href: '/regulator/reporting', icon: '📈' },
    { name: 'Compliance Issues', href: '/regulator/compliance/issues', icon: '📋' },
    { name: 'Audit Schedule', href: '/regulator/compliance/audits', icon: '📅' },
    { name: 'Regulatory Alerts', href: '/regulator/alerts', icon: '⚠️' },
    { name: 'Broadcasts', href: '/regulator/broadcasts', icon: '📢' },
];

// BoB Compliance Officer — rules, KYC, compliance monitoring
const bobComplianceNav: NavItem[] = [
    { name: 'Dashboard', href: '/regulator/dashboard', icon: '📊' },
    { name: 'SACCO Directory', href: '/regulator/saccos', icon: '🏢' },
    { name: 'Compliance Monitoring', href: '/regulator/compliance', icon: '✅' },
    { name: '  → Issues', href: '/regulator/compliance/issues', icon: '📋' },
    { name: '  → KYC Verification', href: '/regulator/compliance/kyc', icon: '✓' },
    { name: '  → Rules', href: '/regulator/compliance/rules', icon: '🤖' },
    { name: '  → Scores', href: '/regulator/compliance/scores', icon: '📊' },
    { name: 'Bye-laws', href: '/regulator/bylaws', icon: '📜' },
    { name: 'Regulatory Alerts', href: '/regulator/alerts', icon: '⚠️' },
    { name: 'Reports', href: '/regulator/reporting', icon: '📈' },
    { name: 'Broadcasts', href: '/regulator/broadcasts', icon: '📢' },
];

const superRegulatorItems: NavItem[] = [
    { name: 'Platform Management', href: '/regulator/settings/system', icon: '🌐' },
    { name: '  → System Settings', href: '/regulator/settings/system', icon: '⚙️' },
    { name: '  → Tenant Explorer', href: '/regulator/saccos', icon: '🏢' },
    { name: '  → Platform Logs', href: '/regulator/logs', icon: '📜' },
];

// Map role → { navItems, label, color }
const BOB_ROLE_CONFIG: Record<string, { nav: NavItem[]; label: string; color: string }> = {
    BOB_PRUDENTIAL_SUPERVISOR: { nav: bobPrudentialNav, label: 'BoB — Prudential Supervisor', color: 'text-purple-700 bg-purple-50' },
    BOB_FINANCIAL_AUDITOR: { nav: bobFinancialAuditorNav, label: 'BoB — Financial Auditor', color: 'text-blue-700 bg-blue-50' },
    BOB_COMPLIANCE_OFFICER: { nav: bobComplianceNav, label: 'BoB — Compliance Officer', color: 'text-teal-700 bg-teal-50' },
};

export default function RegulatorSidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    // Determine which nav to show based on BoB sub-role
    const bobConfig = user?.role ? BOB_ROLE_CONFIG[user.role] : undefined;
    const activeNav = bobConfig ? bobConfig.nav : dcdNavItems;

    return (
        <div className="flex flex-col h-full glass-panel overflow-hidden">
            {/* Logo/Branding */}
            <div className="p-6 border-b border-white/20 bg-white/10 backdrop-blur-md">
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">KIKA Platform</h1>
                <p className="text-xs text-gray-500 mt-1 font-bold uppercase tracking-wider">Regulatory Portal</p>
                {bobConfig && (
                    <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${bobConfig.color}`}>
                        {bobConfig.label}
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <ul className="space-y-1">
                    {activeNav.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 translate-x-1'
                                        : 'text-gray-600 hover:bg-white/50 hover:text-primary-600 hover:translate-x-1'
                                        }`}
                                >
                                    <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                                    <span className="font-medium">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    )}
                                </Link>
                            </li>
                        );
                    })}

                    {user?.role === 'super_regulator' && (
                        <>
                            <div className="px-4 py-2 mt-4 mb-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Platform Admin</p>
                            </div>
                            {superRegulatorItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${isActive
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1'
                                                : 'text-gray-600 hover:bg-white/50 hover:text-indigo-600 hover:translate-x-1'
                                                }`}
                                        >
                                            <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                                            <span className="font-medium">{item.name}</span>
                                            {isActive && (
                                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </>
                    )}
                </ul>
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold shadow-md">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white/50 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-white/40"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
