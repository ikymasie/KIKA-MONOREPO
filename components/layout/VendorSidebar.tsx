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
    { name: 'Dashboard', href: '/vendor/dashboard', icon: '📊' },
    { name: 'My Orders', href: '/vendor/orders', icon: '📦' },
    { name: 'Inventory Alerts', href: '/vendor/alerts', icon: '⚠️' },
    { name: 'Profile', href: '/vendor/profile', icon: '👤' },
];

export default function VendorSidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { branding } = useBranding();

    return (
        <div className="flex flex-col h-full glass-panel overflow-hidden bg-slate-900 text-white">
            {/* Logo/Branding */}
            <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        V
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold text-white leading-tight">
                            {branding?.name || 'KIKA Vendor'}
                        </h1>
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Partner Portal</p>
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
                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className={`text-xl transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`}>{item.icon}</span>
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Info & Logout */}
            <div className="p-4 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold shadow-md">
                        {user?.name?.charAt(0) || 'V'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.name || 'Vendor User'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="w-full px-4 py-2 text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
