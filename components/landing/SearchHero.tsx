'use client';

import { useState } from 'react';
import { Search, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground from './AnimatedBackground';

interface SearchHeroProps {
    onLoginClick: () => void;
}

export default function SearchHero({ onLoginClick }: SearchHeroProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Searching for:', searchQuery);
    };

    const trendingSearches = [
        'Loan Application',
        'Member Benefits',
        'Society Registration',
        'Insurance Coverage'
    ];

    return (
        <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Animated Background with Parallax */}
            <AnimatedBackground />

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 py-32 text-center">
                {/* Main Heading — slides in from top */}
                <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-down drop-shadow-lg">
                    Explore the Future of
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-purple-200 drop-shadow-none">
                        Society &amp; Co-op Management
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto animate-reveal-up delay-200 drop-shadow-md">
                    Multi-Tenant Member Management Platform for Societies, Co-operatives &amp; Financial Institutions
                </p>

                {/* Search Bar */}
                <form
                    onSubmit={handleSearch}
                    className="max-w-3xl mx-auto mb-8 animate-reveal-up delay-400"
                >
                    <div className={`relative group ${isFocused ? 'scale-105' : ''} transition-transform duration-300`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                        <div className="relative glass rounded-full flex items-center overflow-hidden p-2">
                            <Search className="ml-4 text-white/70" size={24} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Search for societies, co-ops, services, or information..."
                                className="flex-1 px-4 py-4 text-lg bg-transparent border-none outline-none text-white placeholder:text-white/60"
                            />
                            <button
                                type="submit"
                                className="px-8 py-3 bg-white text-primary-600 rounded-full font-bold hover:shadow-lg transition-all hover:scale-105"
                            >
                                Search
                            </button>
                        </div>
                    </div>
                </form>

                {/* Trending Searches */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-12 animate-reveal-up delay-600">
                    <span className="text-white/80 font-medium flex items-center gap-2 drop-shadow-md">
                        <TrendingUp size={16} />
                        Trending:
                    </span>
                    {trendingSearches.map((search, i) => (
                        <button
                            key={search}
                            onClick={() => setSearchQuery(search)}
                            className="px-4 py-1.5 glass-button rounded-full text-white/90 text-sm hover:bg-white/20 transition-all border border-white/20 hover:scale-105 animate-reveal-up"
                            style={{ animationDelay: `${600 + i * 80}ms` }}
                        >
                            {search}
                        </button>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-reveal-up delay-800">
                    <Link
                        href="/auth/signup"
                        className="px-8 py-4 bg-white text-primary-600 rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:scale-105"
                    >
                        Get Started
                    </Link>
                    <button
                        onClick={() => {
                            const element = document.getElementById('about');
                            element?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="px-8 py-4 glass text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all hover:scale-105"
                    >
                        Learn More
                    </button>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce animate-fade-in delay-900">
                    <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2 backdrop-blur-sm">
                        <div className="w-1.5 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
