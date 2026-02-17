'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from '@/lib/auth-context';

interface BrandingSettings {
    name?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    brandingSettings?: {
        sidebarTheme?: 'light' | 'dark' | 'custom';
        accentColor?: string;
        faviconUrl?: string;
    };
}

interface BrandingContextType {
    branding: BrandingSettings | null;
    loading: boolean;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuthContext();
    const [branding, setBranding] = useState<BrandingSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBranding() {
            if (!user?.tenantId) {
                setBranding(null);
                setLoading(false);
                return;
            }

            try {
                // Fetch public branding settings (even for non-admins)
                const response = await fetch(`/api/branding/${user.tenantId}`);
                if (response.ok) {
                    const data = await response.json();
                    setBranding(data);
                    applyBranding(data);
                }
            } catch (error) {
                console.error('Failed to fetch branding:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchBranding();
    }, [user?.tenantId]);

    const applyBranding = (data: BrandingSettings) => {
        if (typeof document === 'undefined') return;

        const root = document.documentElement;
        if (data.primaryColor) {
            // Generate basic palette-like variables if needed, or just set the main ones
            root.style.setProperty('--primary-500', data.primaryColor);
            // Simulating shades for now, ideally use a library like tinycolor2 or chroma-js
            root.style.setProperty('--primary-600', adjustColor(data.primaryColor, -20));
            root.style.setProperty('--primary-700', adjustColor(data.primaryColor, -40));
            root.style.setProperty('--primary-50', adjustColor(data.primaryColor, 90));
        }
        if (data.secondaryColor) {
            root.style.setProperty('--secondary-500', data.secondaryColor);
            root.style.setProperty('--secondary-600', adjustColor(data.secondaryColor, -20));
        }
    };

    // Helper to lighten/darken color
    const adjustColor = (hex: string, percent: number) => {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const B = ((num >> 8) & 0x00FF) + amt;
        const G = (num & 0x0000FF) + amt;

        return '#' + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 0 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 0 ? 0 : G : 255)).toString(16).slice(1);
    };

    return (
        <BrandingContext.Provider value={{ branding, loading }}>
            {children}
        </BrandingContext.Provider>
    );
}

export function useBranding() {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
}
