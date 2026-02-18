'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-hooks';
import { LayoutDashboard, FileText, Users, Upload, MessageSquare, LogOut, Building2 } from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/applicant', icon: LayoutDashboard },
    { name: 'Apply Now', href: '/applicant/apply', icon: FileText },
    { name: 'Founding Members', href: '/applicant/members', icon: Users },
    { name: 'Upload Documents', href: '/applicant/documents', icon: Upload },
    { name: 'My Appeals', href: '/applicant/appeals', icon: MessageSquare },
];

export default function ApplicantSidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    return (
        <div className="flex flex-col h-full glass-panel overflow-hidden">
            {/* Logo/Branding */}
            <div className="p-6 border-b border-white/20 bg-white/10 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1 text-primary-600">
                    <Building2 size={24} />
                    <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">KIKA Platform</h1>
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Applicant Portal</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
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
                                    <Icon size={20} className={`transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : ''}`} />
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
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold shadow-md">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.name || 'Applicant'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 shadow-sm border border-red-100"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </div>
    );
}
