import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { BrandingProvider } from '@/components/providers/BrandingProvider';
import { NextAuthProvider } from '@/components/providers/NextAuthProvider';
import RouteProgressBar from '@/components/common/RouteProgressBar';
import GlobalLoadingOverlay from '@/components/common/GlobalLoadingOverlay';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'KIKA Platform - SACCOS Management System',
    description: 'Multi-Tenant SACCOS Member Management Platform for Botswana',
};

import { Toaster } from 'sonner';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <Suspense fallback={null}>
                    <GlobalLoadingOverlay />
                    <RouteProgressBar />
                </Suspense>
                <NextAuthProvider>
                    <AuthProvider>
                        <BrandingProvider>
                            {children}
                            <Toaster position="top-right" richColors />
                        </BrandingProvider>
                    </AuthProvider>
                </NextAuthProvider>
            </body>
        </html>
    );
}
