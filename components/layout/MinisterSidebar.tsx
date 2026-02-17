'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-hooks';

interface NavItem {
    name: string;
    href: string;
    icon: string;
}

const navItems: NavItem[] = [
    { name: 'Oversight Cabinet', href: '/minister/dashboard', icon: '🏛️' },
    { name: 'Appeals Adjudication', href: '/minister/appeals', icon: '⚖️' },
    { name: 'Final Approvals', href: '/minister/approvals', icon: '✍️' },
    { name: 'Policy Decision Tools', href: '/minister/policy', icon: '📜' },
    { name: 'Official Registry', href: '/regulator/registry', icon: '📒' },
    { name: 'Settings', href: '/minister/settings', icon: '⚙️' },
];

export default function MinisterSidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    return (
        <div className="flex flex-col h-full glass-panel overflow-hidden border-r border-white/20">
            {/* Logo/Branding */}
            <div className="p-6 border-b border-white/20 bg-white/10 backdrop-blur-md">
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-800">KIKA Platform</h1>
                <p className="text-xs text-indigo-900 mt-1 font-bold uppercase tracking-wider">Ministerial Cabinet</p>
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
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-lg shadow-indigo-500/30 translate-x-1'
                                        : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:translate-x-1'
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
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-800 to-purple-900 flex items-center justify-center text-white font-semibold shadow-md">
                        {user?.name?.charAt(0) || 'M'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.name || 'Minister'}
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
