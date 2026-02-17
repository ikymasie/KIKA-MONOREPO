'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from './auth-context';

/**
 * Hook to access authentication context
 */
export function useAuth() {
    return useAuthContext();
}

/**
 * Hook that requires authentication and redirects to sign-in if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/auth/signin') {
    const { user, loading } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push(redirectTo);
        }
    }, [user, loading, router, redirectTo]);

    return { user, loading };
}

/**
 * Hook that requires specific role(s) and redirects if not authorized
 */
export function useRequireRole(
    allowedRoles: string[],
    redirectTo: string = '/auth/signin',
    unauthorizedRedirect: string = '/'
) {
    const { user, loading } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push(redirectTo);
            } else if (!allowedRoles.includes(user.role)) {
                router.push(unauthorizedRedirect);
            }
        }
    }, [user, loading, allowedRoles, router, redirectTo, unauthorizedRedirect]);

    return { user, loading };
}

/**
 * Hook to check if user has specific role(s)
 */
export function useHasRole(allowedRoles: string[]): boolean {
    const { user } = useAuthContext();
    return user ? allowedRoles.includes(user.role) : false;
}

/**
 * Hook to check if user is a regulator (DCD or BoB)
 */
export function useIsRegulator(): boolean {
    return useHasRole([
        // DCD roles
        'dcd_director',
        'dcd_field_officer',
        'dcd_compliance_officer',
        // BoB roles
        'bob_prudential_supervisor',
        'bob_financial_auditor',
        'bob_compliance_officer',
        // Shared
        'deduction_officer',
    ]);
}

/**
 * Hook to check if user is from Department of Co-operative Development
 */
export function useIsDCD(): boolean {
    return useHasRole([
        'dcd_director',
        'dcd_field_officer',
        'dcd_compliance_officer',
    ]);
}

/**
 * Hook to check if user is from Bank of Botswana
 */
export function useIsBoB(): boolean {
    return useHasRole([
        'bob_prudential_supervisor',
        'bob_financial_auditor',
        'bob_compliance_officer',
    ]);
}

/**
 * Hook to check if user is a tenant admin
 */
export function useIsTenantAdmin(): boolean {
    return useHasRole([
        'saccos_admin',
        'loan_officer',
        'accountant',
        'member_service_rep',
        'credit_committee',
    ]);
}

/**
 * Hook to check if user is a member
 */
export function useIsMember(): boolean {
    return useHasRole(['member']);
}
