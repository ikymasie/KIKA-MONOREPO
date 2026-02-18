'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X } from 'lucide-react';

interface LoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const portals = [
        {
            title: 'SACCOS Admin',
            description: 'Complete management system for SACCOS operations and administration',
            icon: '🏢',
            route: '/auth/signin?portal=admin',
            features: ['Member management', 'Loan processing', 'Financial reporting', 'Product configuration']
        },
        {
            title: 'Member Portal',
            description: 'Self-service portal for SACCOS members to manage their accounts',
            icon: '👤',
            route: '/auth/signin?portal=member',
            features: ['Account balances', 'Loan applications', 'Digital statements', 'Insurance coverage']
        }
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 animate-fade-in"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="glass-deep rounded-3xl shadow-2xl max-w-4xl w-full pointer-events-auto animate-scale-in overflow-hidden border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-600/90 to-secondary-600/90 px-8 py-8 relative backdrop-blur-sm">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-sm">
                            Choose Your Portal
                        </h2>
                        <p className="text-white/90 text-lg">
                            Select the portal you'd like to access
                        </p>
                    </div>

                    {/* Portal Options */}
                    <div className="grid md:grid-cols-2 gap-6 p-8 bg-white/40 backdrop-blur-lg">
                        {portals.map((portal) => (
                            <button
                                key={portal.title}
                                onClick={() => router.push(portal.route)}
                                className="group text-left p-6 rounded-2xl bg-white/60 border-2 border-white/50 hover:border-primary-400 hover:bg-white/80 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] shadow-sm"
                            >
                                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-md">
                                    {portal.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                    {portal.title}
                                </h3>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    {portal.description}
                                </p>
                                <ul className="space-y-2 mb-6">
                                    {portal.features.map((feature) => (
                                        <li key={feature} className="text-sm text-gray-500 flex items-center gap-2 group-hover:text-gray-700 transition-colors">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <div className="inline-flex items-center text-primary-600 font-bold group-hover:gap-2 transition-all bg-primary-50 px-4 py-2 rounded-lg group-hover:bg-primary-100">
                                    Sign In
                                    <span className="ml-1 group-hover:ml-0 transition-all">→</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Footer Note */}
                    <div className="px-8 pb-8 pt-2 text-center bg-white/40 backdrop-blur-lg">
                        <div className="h-px bg-gray-100 mb-6 mx-auto w-1/2"></div>
                        <p className="text-gray-500 font-medium mb-3">
                            Looking to register a new Society or SACCO?
                        </p>
                        <Link
                            href="/auth/signup"
                            onClick={onClose}
                            className="inline-flex items-center gap-2 text-primary-600 font-extrabold hover:text-primary-700 transition-colors"
                        >
                            Apply for Registration →
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
