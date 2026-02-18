'use client';

import { useRef } from 'react';
import { Users, Shield, TrendingUp, Award } from 'lucide-react';
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation';

export default function AboutSection() {
    const { ref: headerRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });
    const { ref: statsRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1, staggerChildren: true });
    const { ref: featuresRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.05 });

    const stats = [
        { icon: Users, value: '10,000+', label: 'Active Members' },
        { icon: Shield, value: '50+', label: 'Society Partners' },
        { icon: TrendingUp, value: '99.9%', label: 'Uptime' },
        { icon: Award, value: '#1', label: 'in Botswana' }
    ];

    const features = [
        {
            title: 'Secure & Compliant',
            description: 'Built with enterprise-grade security and full regulatory compliance for Botswana financial institutions and societies.',
            icon: Shield,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'Member-Centric',
            description: 'Empowering society and co-op members with self-service tools, real-time insights, and seamless digital experiences.',
            icon: Users,
            color: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Data-Driven',
            description: 'Advanced analytics and reporting tools to help societies and co-operatives make informed decisions and drive growth.',
            icon: TrendingUp,
            color: 'from-orange-500 to-red-500'
        },
        {
            title: 'Award-Winning',
            description: 'Recognized for excellence in financial technology and commitment to cooperative financial services.',
            icon: Award,
            color: 'from-green-500 to-emerald-500'
        }
    ];

    return (
        <section
            id="about"
            className="py-24 bg-gradient-to-b from-white to-gray-50"
        >
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    data-animate
                    className="text-center mb-16 animate-reveal-up"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        About KIKA Platform
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Transforming society and co-operative management in Botswana with cutting-edge technology,
                        seamless integration, and member-first design.
                    </p>
                </div>

                {/* Stats Grid — staggered children */}
                <div
                    ref={statsRef}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
                >
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            data-stagger-child
                            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-center animate-reveal-up"
                        >
                            <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary-600" />
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Features Grid — alternating slide-in */}
                <div
                    ref={featuresRef}
                    className="grid md:grid-cols-2 gap-8"
                >
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            data-animate
                            className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${index % 2 === 0 ? 'animate-slide-in-left' : 'animate-slide-in-right'
                                }`}
                            style={{ animationDelay: `${index * 120}ms` }}
                        >
                            {/* Gradient Background on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>

                            <div className="relative">
                                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
