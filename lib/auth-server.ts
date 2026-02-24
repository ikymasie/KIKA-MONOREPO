import { NextRequest } from 'next/server';
import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from './authOptions';

export interface ServerSession {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        tenantId?: string;
        firebaseUid: string;
    };
    firebaseToken?: any;
}

const DEFAULT_TENANT_ID = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'kika-default-tenant';

function enrichUserWithMethods(user: any) {
    return {
        ...user,
        // Fallback default tenant id for bypass on-prem
        tenantId: user.tenantId || DEFAULT_TENANT_ID,
        isTenantAdmin() {
            return ['saccos_admin', 'loan_officer', 'accountant', 'member_service_rep', 'credit_committee'].includes(user.role);
        },
        isRegulator() {
            return ['super_regulator', 'dcd_director', 'dcd_field_officer', 'dcd_compliance_officer',
                'bob_prudential_supervisor', 'bob_financial_auditor', 'bob_compliance_officer', 'deduction_officer'].includes(user.role);
        },
        isDCD() {
            return ['dcd_director', 'dcd_field_officer', 'dcd_compliance_officer'].includes(user.role);
        },
        isBoB() {
            return ['bob_prudential_supervisor', 'bob_financial_auditor', 'bob_compliance_officer'].includes(user.role);
        },
        isApplicant() {
            return ['society_applicant', 'cooperative_applicant'].includes(user.role);
        },
        isGovernmentOfficer() {
            return ['registry_clerk', 'intelligence_liaison', 'legal_officer', 'registrar', 'director_cooperatives', 'minister_delegate'].includes(user.role);
        },
    };
}

/**
 * Get the current user session from NextAuth.
 */
export async function getServerSession(): Promise<ServerSession | null> {
    try {
        const session = await getNextAuthSession(authOptions) as any;
        if (!session?.user) {
            return null;
        }

        return {
            user: {
                ...session.user,
                tenantId: session.user.tenantId || DEFAULT_TENANT_ID,
            },
        };
    } catch (error) {
        console.error('Error getting server session:', error);
        return null;
    }
}

/**
 * Require authentication on server-side (throws if not authenticated)
 */
export async function requireAuth(): Promise<ServerSession> {
    const session = await getServerSession();
    if (!session) {
        throw new Error('Unauthorized');
    }
    return session;
}

/**
 * Require specific role on server-side (throws if not authenticated or wrong role)
 */
export async function requireRole(allowedRoles: string[]): Promise<ServerSession> {
    const session = await requireAuth();
    if (!allowedRoles.includes(session.user.role)) {
        throw new Error('Forbidden');
    }
    return session;
}

/**
 * Get User entity from NextRequest (for API routes).
 */
export async function getUserFromRequest(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session?.user) {
            return null;
        }

        return enrichUserWithMethods(session.user);
    } catch (error) {
        console.error('Error getting user from request:', error);
        return null;
    }
}
