'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-hooks';
import { useBranding } from '@/components/providers/BrandingProvider';

interface NavItem {
    name: string;
    href: string;
    icon: string;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { name: 'Members', href: '/admin/members', icon: '👥' },
    { name: 'Loans', href: '/admin/loans', icon: '💰' },
    { name: 'Savings', href: '/admin/savings', icon: '💵' },
    { name: 'Insurance', href: '/admin/insurance', icon: '🛡️' },
    { name: 'Merchandise', href: '/admin/merchandise', icon: '🛒' },
    { name: 'Deductions', href: '/admin/deductions', icon: '📋' },
    { name: 'Reports', href: '/admin/reports', icon: '📈' },
    { name: 'Team Management', href: '/admin/team', icon: '👤' },
    { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { branding } = useBranding();

    return (
        <div className="flex flex-col h-full glass-panel overflow-hidden">
            {/* Logo/Branding */}
            <div className="p-6 border-b border-white/20 bg-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    {branding?.logoUrl ? (
                        <img src={branding.logoUrl} alt="Logo" className="h-10 w-auto object-contain drop-shadow-lg" />
                    ) : (
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30">
                            K
                        </div>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">
                            {branding?.name || 'KIKA Platform'}
                        </h1>
                        <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">SACCOS Admin</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <ul className="space-y-1">
                    {navItems.map((item) => {
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
                </ul>
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-white/20 bg-white/10 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-secondary-400 to-pink-600 flex items-center justify-center text-white font-semibold shadow-md">
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
