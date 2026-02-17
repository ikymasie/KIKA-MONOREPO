'use client';

import { useState } from 'react';
import LandingNav from '@/components/landing/LandingNav';
import SearchHero from '@/components/landing/SearchHero';
import AboutSection from '@/components/landing/AboutSection';
import ForSaccossSection from '@/components/landing/ForSaccossSection';
import ForMembersSection from '@/components/landing/ForMembersSection';
import ContactSection from '@/components/landing/ContactSection';
import LandingFooter from '@/components/landing/LandingFooter';
import LoginDialog from '@/components/landing/LoginDialog';

export default function HomePage() {
    const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

    return (
        <div className="landing-page">
            {/* Navigation */}
            <LandingNav onLoginClick={() => setIsLoginDialogOpen(true)} />

            {/* Hero Section with Search */}
            <SearchHero onLoginClick={() => setIsLoginDialogOpen(true)} />

            {/* About Section */}
            <AboutSection />

            {/* For SACCOSS Section */}
            <ForSaccossSection />

            {/* For Members Section */}
            <ForMembersSection />

            {/* Contact Section */}
            <ContactSection />

            {/* Footer */}
            <LandingFooter />

            {/* Login Dialog */}
            <LoginDialog
                isOpen={isLoginDialogOpen}
                onClose={() => setIsLoginDialogOpen(false)}
            />
        </div>
    );
}
