'use client';

import { Building2, Users, FileText, BarChart3, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation';

export default function ForSaccossSection() {
    const { ref: headerRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
    const { ref: gridRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.05, staggerChildren: true });
    const { ref: ctaRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

    const features = [
        {
            icon: Users,
            title: 'Member Management',
            description: 'Comprehensive member database, onboarding workflows, and lifecycle management tools.',
            benefits: ['Digital onboarding', 'KYC compliance', 'Member profiles', 'Dependent tracking']
        },
        {
            icon: FileText,
            title: 'Loan Processing',
            description: 'Streamlined loan application, approval, and disbursement with automated workflows.',
            benefits: ['Application tracking', 'Credit scoring', 'Approval workflows', 'Disbursement automation']
        },
        {
            icon: BarChart3,
            title: 'Financial Reporting',
            description: 'Real-time financial insights, regulatory reports, and customizable dashboards.',
            benefits: ['Real-time analytics', 'Regulatory compliance', 'Custom reports', 'Export capabilities']
        },
        {
            icon: Settings,
            title: 'Product Configuration',
            description: 'Flexible product builder for loans, savings, and insurance offerings.',
            benefits: ['Product templates', 'Rate management', 'Terms configuration', 'Bundle creation']
        },
        {
            icon: Shield,
            title: 'Compliance & Security',
            description: 'Built-in compliance tools and enterprise-grade security for peace of mind.',
            benefits: ['Audit trails', 'Role-based access', 'Data encryption', 'Regulatory updates']
        },
        {
            icon: Building2,
            title: 'Multi-Branch Support',
            description: 'Manage multiple branches and locations from a single unified platform.',
            benefits: ['Branch management', 'Centralized data', 'Branch reporting', 'User permissions']
        }
    ];

    return (
        <section
            id="for-saccoss"
            className="py-24 bg-gradient-to-b from-gray-50 to-white"
        >
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    data-animate
                    className="text-center mb-16 animate-reveal-up"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full font-medium mb-4">
                        <Building2 size={20} />
                        For Societies &amp; Co-operatives
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Everything You Need to Manage Your Society
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        A complete, integrated platform designed for SACCOS, co-operatives, and financial societies in Botswana.
                    </p>
                </div>

                {/* Features Grid — staggered */}
                <div
                    ref={gridRef}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            data-stagger-child
                            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-reveal-up"
                        >
                            <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 mb-6 group-hover:scale-110 transition-transform shadow-lg">
                                <feature.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {feature.description}
                            </p>
                            <ul className="space-y-2">
                                {feature.benefits.map((benefit) => (
                                    <li key={benefit} className="flex items-center gap-2 text-sm text-gray-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div
                    ref={ctaRef}
                    data-animate
                    className="mt-16 text-center animate-scale-in"
                >
                    <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl p-12 text-white">
                        <h3 className="text-3xl font-bold mb-4">Ready to Transform Your Society?</h3>
                        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                            Join leading societies and co-operatives across Botswana using KIKA Platform
                        </p>
                        <Link
                            href="/auth/signup"
                            className="inline-block px-10 py-5 bg-white text-primary-600 rounded-full font-extrabold text-xl hover:shadow-2xl transition-all hover:scale-105"
                        >
                            Get Started Now
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
