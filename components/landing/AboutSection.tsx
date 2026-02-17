'use client';

import { useEffect, useRef, useState } from 'react';
import { Users, Shield, TrendingUp, Award } from 'lucide-react';

export default function AboutSection() {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const stats = [
        { icon: Users, value: '10,000+', label: 'Active Members' },
        { icon: Shield, value: '50+', label: 'SACCOSS Partners' },
        { icon: TrendingUp, value: '99.9%', label: 'Uptime' },
        { icon: Award, value: '#1', label: 'in Botswana' }
    ];

    const features = [
        {
            title: 'Secure & Compliant',
            description: 'Built with enterprise-grade security and full regulatory compliance for Botswana financial institutions.',
            icon: Shield,
            color: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'Member-Centric',
            description: 'Empowering SACCOS members with self-service tools, real-time insights, and seamless digital experiences.',
            icon: Users,
            color: 'from-purple-500 to-pink-500'
        },
        {
            title: 'Data-Driven',
            description: 'Advanced analytics and reporting tools to help SACCOSS make informed decisions and drive growth.',
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
            ref={sectionRef}
            className="py-24 bg-gradient-to-b from-white to-gray-50"
        >
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className={`text-center mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        About KIKA Platform
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Transforming SACCOS management in Botswana with cutting-edge technology,
                        seamless integration, and member-first design.
                    </p>
                </div>

                {/* Stats Grid */}
                <div className={`grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 ${isVisible ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-center"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary-600" />
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Features Grid */}
                <div className={`grid md:grid-cols-2 gap-8 ${isVisible ? 'animate-fade-in-up animation-delay-400' : 'opacity-0'}`}>
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
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
