'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface LandingNavProps {
    onLoginClick: () => void;
}

export default function LandingNav({ onLoginClick }: LandingNavProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setIsMobileMenuOpen(false);
        }
    };

    const navLinks = [
        { label: 'Home', id: 'home' },
        { label: 'About', id: 'about' },
        { label: 'For SACCOSS', id: 'for-saccoss' },
        { label: 'For Members', id: 'for-members' },
        { label: 'Contact', id: 'contact' }
    ];

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-center ${isScrolled
                ? 'py-4'
                : 'py-6'
                }`}
        >
            <div className={`container mx-auto px-4 transition-all duration-300 flex items-center justify-between ${isScrolled
                ? 'glass-panel mx-4 px-6 py-3 shadow-2xl shadow-primary-900/10'
                : ''
                }`}>
                {/* Logo */}
                <button
                    onClick={() => scrollToSection('home')}
                    className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
                >
                    KIKA
                </button>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <button
                            key={link.id}
                            onClick={() => scrollToSection(link.id)}
                            className={`font-medium text-sm transition-colors hover:text-primary-600 ${isScrolled ? 'text-gray-700' : 'text-white'
                                }`}
                        >
                            {link.label}
                        </button>
                    ))}
                    <button
                        onClick={onLoginClick}
                        className="btn btn-primary px-6 py-2 rounded-full shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 transition-all hover:scale-105"
                    >
                        Login
                    </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className={`md:hidden p-2 rounded-lg transition-colors ${isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                        }`}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-4 right-4 mt-2 p-4 glass-panel animate-slide-down md:hidden">
                    <div className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <button
                                key={link.id}
                                onClick={() => scrollToSection(link.id)}
                                className="text-left font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg px-4 py-3 transition-colors"
                            >
                                {link.label}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                onLoginClick();
                            }}
                            className="btn btn-primary w-full py-3 rounded-xl mt-2"
                        >
                            Login
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
