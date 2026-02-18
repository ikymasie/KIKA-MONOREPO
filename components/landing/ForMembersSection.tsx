'use client';

import { Smartphone, CreditCard, FileText, Bell, Lock, Zap } from 'lucide-react';
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation';

export default function ForMembersSection() {
    const { ref: headerRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
    const { ref: gridRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.05, staggerChildren: true });
    const { ref: statsRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

    const features = [
        {
            icon: Smartphone,
            title: '24/7 Account Access',
            description: 'Check your balances, view transactions, and manage your account anytime, anywhere.',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            icon: CreditCard,
            title: 'Easy Loan Applications',
            description: 'Apply for loans online with instant status updates and transparent approval processes.',
            gradient: 'from-purple-500 to-pink-500'
        },
        {
            icon: FileText,
            title: 'Digital Statements',
            description: 'Access your statements, transaction history, and financial documents instantly.',
            gradient: 'from-orange-500 to-red-500'
        },
        {
            icon: Bell,
            title: 'Real-Time Notifications',
            description: 'Stay informed with instant alerts for transactions, approvals, and important updates.',
            gradient: 'from-green-500 to-emerald-500'
        },
        {
            icon: Lock,
            title: 'Secure & Private',
            description: 'Your data is protected with bank-level security and encryption.',
            gradient: 'from-indigo-500 to-purple-500'
        },
        {
            icon: Zap,
            title: 'Lightning Fast',
            description: 'Experience blazing-fast performance with our optimized platform.',
            gradient: 'from-yellow-500 to-orange-500'
        }
    ];

    return (
        <section
            id="for-members"
            className="py-24 bg-gradient-to-b from-white to-primary-50"
        >
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    data-animate
                    className="text-center mb-16 animate-reveal-up"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-100 text-secondary-700 rounded-full font-medium mb-4">
                        <Smartphone size={20} />
                        For Members
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Your Financial Life, Simplified
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Manage your SACCOS membership with ease through our intuitive member portal.
                    </p>
                </div>

                {/* Features Grid — staggered */}
                <div
                    ref={gridRef}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
                >
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            data-stagger-child
                            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden animate-reveal-up"
                        >
                            {/* Gradient overlay on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>

                            <div className="relative">
                                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all shadow-lg`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Member Benefits Highlight — slide in from sides */}
                <div
                    ref={statsRef}
                    className="grid md:grid-cols-3 gap-8"
                >
                    <div data-animate className="text-center p-8 bg-white rounded-2xl shadow-lg animate-slide-in-left">
                        <div className="text-4xl font-bold text-primary-600 mb-2">100%</div>
                        <div className="text-gray-600">Digital Experience</div>
                    </div>
                    <div data-animate className="text-center p-8 bg-white rounded-2xl shadow-lg animate-reveal-up delay-200">
                        <div className="text-4xl font-bold text-secondary-600 mb-2">24/7</div>
                        <div className="text-gray-600">Available Support</div>
                    </div>
                    <div data-animate className="text-center p-8 bg-white rounded-2xl shadow-lg animate-slide-in-right">
                        <div className="text-4xl font-bold text-green-600 mb-2">0</div>
                        <div className="text-gray-600">Hidden Fees</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
