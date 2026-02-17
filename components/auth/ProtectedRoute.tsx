'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-hooks';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    redirectTo?: string;
}

export default function ProtectedRoute({
    children,
    allowedRoles,
    redirectTo = '/auth/signin',
}: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push(redirectTo);
            } else if (allowedRoles && !allowedRoles.includes(user.role)) {
                router.push('/');
            } else if (user.role !== 'SACCOS_ADMIN' && user.role !== 'SUPER_ADMIN') {
                // Check for maintenance mode for non-admin users
                fetch('/api/auth/maintenance-status')
                    .then(res => res.json())
                    .then(data => {
                        if (data.isMaintenanceMode) {
                            router.push('/maintenance');
                        }
                    })
                    .catch(err => console.error('Maintenance check failed', err));
            }
        }
    }, [user, loading, allowedRoles, router, redirectTo]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
        return null;
    }

    return <>{children}</>;
}
