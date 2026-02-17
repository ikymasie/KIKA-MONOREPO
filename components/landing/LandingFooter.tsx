'use client';

import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react';

export default function LandingFooter() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        Platform: [
            { label: 'About Us', href: '#about' },
            { label: 'Features', href: '#for-saccoss' },
            { label: 'Pricing', href: '#contact' },
            { label: 'Contact', href: '#contact' }
        ],
        'For SACCOSS': [
            { label: 'Member Management', href: '#for-saccoss' },
            { label: 'Loan Processing', href: '#for-saccoss' },
            { label: 'Reporting', href: '#for-saccoss' },
            { label: 'Compliance', href: '#for-saccoss' }
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
                {/* Main Footer Content */}
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent mb-4">
                            KIKA Platform
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Transforming SACCOS management in Botswana with cutting-edge technology.
                        </p>
                        <div className="flex gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                                >
                                    <social.icon size={20} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="font-bold mb-4">{category}</h4>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <button
                                            onClick={() => scrollToSection(link.href)}
                                            className="text-gray-400 hover:text-white transition-colors text-left"
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
                                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg font-medium hover:shadow-lg transition-all"
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
