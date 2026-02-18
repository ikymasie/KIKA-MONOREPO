'use client';

import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react';
import { useScrollAnimation } from '@/lib/hooks/useScrollAnimation';
import Image from 'next/image';

export default function LandingFooter() {
    const currentYear = new Date().getFullYear();
    const { ref: footerRef } = useScrollAnimation<HTMLDivElement>({ threshold: 0.05, staggerChildren: true });

    const footerLinks = {
        Platform: [
            { label: 'About Us', href: '#about' },
            { label: 'Features', href: '#for-societies' },
            { label: 'Pricing', href: '#contact' },
            { label: 'Contact', href: '#contact' }
        ],
        'For Societies': [
            { label: 'Member Management', href: '#for-societies' },
            { label: 'Loan Processing', href: '#for-societies' },
            { label: 'Reporting', href: '#for-societies' },
            { label: 'Compliance', href: '#for-societies' }
        ],
        'For Members': [
            { label: 'Account Access', href: '#for-members' },
            { label: 'Loan Applications', href: '#for-members' },
            { label: 'Digital Statements', href: '#for-members' },
            { label: 'Support', href: '#contact' }
        ],
        Legal: [
            { label: 'Privacy Policy', href: '#' },
            { label: 'Terms of Service', href: '#' },
            { label: 'Cookie Policy', href: '#' },
            { label: 'Compliance', href: '#' }
        ]
    };

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
        { icon: Mail, href: 'mailto:info@kikaplatform.bw', label: 'Email' }
    ];

    const scrollToSection = (href: string) => {
        if (href.startsWith('#')) {
            const element = document.getElementById(href.substring(1));
            element?.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8">
            <div className="container mx-auto px-4">
                {/* Main Footer Content — staggered columns */}
                <div
                    ref={footerRef}
                    className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12"
                >
                    {/* Brand Column */}
                    <div
                        data-stagger-child
                        className="lg:col-span-1 animate-fade-in-up"
                    >
                        <div className="mb-4">
                            <Image
                                src="/assets/logos/kika-logo-lightbg.png"
                                alt="KIKA Platform"
                                width={120}
                                height={44}
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <p className="text-gray-400 mb-6">
                            Transforming society and co-operative management in Botswana with cutting-edge technology.
                        </p>
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors hover:scale-110 transition-all"
                                >
                                    <social.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([category, links], i) => (
                        <div
                            key={category}
                            data-stagger-child
                            className="animate-fade-in-up"
                            style={{ '--stagger-index': i + 1 } as React.CSSProperties}
                        >
                            <h4 className="font-bold mb-4">{category}</h4>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <button
                                            onClick={() => scrollToSection(link.href)}
                                            className="text-gray-400 hover:text-white transition-colors text-left hover:translate-x-1 transition-transform inline-block"
                                        >
                                            {link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Newsletter Section */}
                <div className="border-t border-gray-800 pt-8 mb-8">
                    <div className="max-w-md">
                        <h4 className="font-bold mb-2">Stay Updated</h4>
                        <p className="text-gray-400 text-sm mb-4">
                            Subscribe to our newsletter for the latest updates and features.
                        </p>
                        <form className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-2 bg-white/10 border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                            <button
                                type="submit"
                                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg font-medium hover:shadow-lg transition-all hover:scale-105"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
                    <div>
                        © {currentYear} KIKA Platform. All rights reserved.
                    </div>
                    <div className="flex gap-6">
                        <button onClick={() => scrollToSection('#')} className="hover:text-white transition-colors">
                            Privacy
                        </button>
                        <button onClick={() => scrollToSection('#')} className="hover:text-white transition-colors">
                            Terms
                        </button>
                        <button onClick={() => scrollToSection('#')} className="hover:text-white transition-colors">
                            Cookies
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
