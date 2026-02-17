import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { BrandingProvider } from '@/components/providers/BrandingProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'KIKA Platform - SACCOS Management System',
    description: 'Multi-Tenant SACCOS Member Management Platform for Botswana',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <AuthProvider>
                    <BrandingProvider>{children}</BrandingProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
