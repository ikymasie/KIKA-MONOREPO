'use client';

import { useState, ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
    sidebar: ReactNode;
}

export default function DashboardLayout({ children, sidebar }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="relative min-h-screen overflow-hidden bg-surface-50 text-gray-900 font-sans">
            {/* Animated Background */}
            <div className="animated-bg-wrapper fixed inset-0 z-0 pointer-events-none">
                <div className="animated-bg">
                    <div className="orb orb-1"></div>
                    <div className="orb orb-2"></div>
                    <div className="orb orb-3"></div>
                </div>
            </div>

            {/* Global Mesh Overlay for texture */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Floating Sidebar Container */}
            <aside
                className={`fixed top-4 left-4 bottom-4 w-72 z-50 transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'
                    }`}
            >
                {/* The distinct look will come from the sidebar content itself using .glass-panel */}
                <div className="h-full rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden">
                    {sidebar}
                </div>
            </aside>

            {/* Main content area */}
            <div className="lg:pl-80 relative z-10 min-h-screen transition-all duration-300">
                {/* Mobile header with hamburger */}
                <div className="lg:hidden glass m-4 mb-0 rounded-xl px-4 py-3 flex items-center justify-between sticky top-4 z-30">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-white/50 text-primary-700 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6h16M4 12h16M4 18h16"
                            />
                        </svg>
                    </button>
                    <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">KIKA Platform</h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>

                {/* Page content */}
                <main className="p-4 lg:p-8 pt-20 lg:pt-8 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
}
