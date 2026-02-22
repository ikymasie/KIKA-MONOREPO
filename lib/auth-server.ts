import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';
import mysql from 'mysql2/promise';

export interface ServerSession {
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        tenantId?: string;
        firebaseUid: string;
    };
    firebaseToken: any;
}

const SESSION_COOKIE_NAME = 'session';
const SESSION_COOKIE_MAX_AGE = parseInt(
    process.env.FIREBASE_SESSION_COOKIE_MAX_AGE || '604800' // 7 days default
);

/**
 * Create a session cookie from a Firebase ID token
 */
export async function createSessionCookie(idToken: string): Promise<string> {
    const expiresIn = SESSION_COOKIE_MAX_AGE * 1000; // Convert to milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    return sessionCookie;
}

/**
 * Verify a session cookie and return the decoded token
 */
export async function verifySessionCookie(sessionCookie: string) {
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying session cookie:', error);
        return null;
    }
}

/**
 * Look up a User from the DB by firebaseUid using raw MySQL query.
 * Uses mysql2 directly to avoid TypeORM entity metadata circular dependency issues.
 */
async function getUserByFirebaseUid(firebaseUid: string) {
    let connection: mysql.Connection | null = null;
    try {
        connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        });

        const [rows] = await connection.execute(
            'SELECT id, email, firstName, lastName, role, tenantId, firebaseUid, status, phone, mfaEnabled, mustChangePassword, createdAt, updatedAt FROM users WHERE firebaseUid = ? LIMIT 1',
            [firebaseUid]
        );

        const users = rows as any[];
        if (!users || users.length === 0) return null;

        const u = users[0];

        // Return a plain object that mimics the User entity methods used downstream
        return {
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            role: u.role,
            tenantId: u.tenantId,
            firebaseUid: u.firebaseUid,
            status: u.status,
            phone: u.phone,
            mfaEnabled: u.mfaEnabled,
            mustChangePassword: u.mustChangePassword ?? false,
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
            updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
            get fullName() { return `${u.firstName} ${u.lastName}`; },
            isTenantAdmin() {
                return ['saccos_admin', 'loan_officer', 'accountant', 'member_service_rep', 'credit_committee'].includes(u.role);
            },
            isRegulator() {
                return ['super_regulator', 'dcd_director', 'dcd_field_officer', 'dcd_compliance_officer',
                    'bob_prudential_supervisor', 'bob_financial_auditor', 'bob_compliance_officer', 'deduction_officer'].includes(u.role);
            },
            isDCD() {
                return ['dcd_director', 'dcd_field_officer', 'dcd_compliance_officer'].includes(u.role);
            },
            isBoB() {
                return ['bob_prudential_supervisor', 'bob_financial_auditor', 'bob_compliance_officer'].includes(u.role);
            },
            isApplicant() {
                return ['society_applicant', 'cooperative_applicant'].includes(u.role);
            },
            isGovernmentOfficer() {
                return ['registry_clerk', 'intelligence_liaison', 'legal_officer', 'registrar', 'director_cooperatives', 'minister_delegate'].includes(u.role);
            },
        };
    } catch (error) {
        console.error('Error fetching user from DB:', error);
        return null;
    } finally {
        if (connection) await connection.end().catch(() => { });
    }
}

/**
 * Get the current user session from server-side cookies.
 * Role is sourced exclusively from the DB.
 */
export async function getServerSession(): Promise<ServerSession | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

        if (!sessionCookie) {
            return null;
        }

        const decodedToken = await verifySessionCookie(sessionCookie);
        if (!decodedToken) {
            return null;
        }

        const user = await getUserByFirebaseUid(decodedToken.uid);
        if (!user || user.status !== 'active') {
            return null;
        }

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.fullName,
                role: user.role,
                tenantId: user.tenantId,
                firebaseUid: user.firebaseUid!,
            },
            firebaseToken: decodedToken,
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
 * @deprecated Use getUserFromRequest instead.
 * Kept for backward compatibility — returns the DB User entity for the given Firebase UID.
 */
export async function getUserWithClaims(firebaseUid: string) {
    return getUserByFirebaseUid(firebaseUid);
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(sessionCookie: string) {
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
        maxAge: SESSION_COOKIE_MAX_AGE,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get User entity from NextRequest (for API routes).
 * Role is sourced exclusively from the DB — no Firebase custom claims involved.
 */
export async function getUserFromRequest(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!sessionCookie) {
            return null;
        }

        const decodedToken = await verifySessionCookie(sessionCookie);
        if (!decodedToken) {
            return null;
        }

        return await getUserByFirebaseUid(decodedToken.uid);
    } catch (error) {
        console.error('Error getting user from request:', error);
        return null;
    }
}
