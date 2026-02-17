import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

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
 * Get the current user session from server-side
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

        // Dynamically import database to avoid circular dependencies
        const { AppDataSource } = await import('../src/config/database');
        const { User } = await import('../src/entities/User');

        // Initialize database if needed
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Get user from database
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { firebaseUid: decodedToken.uid },
            relations: ['tenant'],
        });

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
 * Get user with custom claims from Firebase token
 */
export async function getUserWithClaims(firebaseUid: string) {
    try {
        // Dynamically import database to avoid circular dependencies
        const { AppDataSource } = await import('../src/config/database');
        const { User } = await import('../src/entities/User');

        // Initialize database if needed
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { firebaseUid },
            relations: ['tenant'],
        });

        return user;
    } catch (error) {
        console.error('Error getting user with claims:', error);
        return null;
    }
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
 * Get User entity from NextRequest (for API routes)
 */
export async function getUserFromRequest(request: NextRequest) {
    try {
        // Get session from cookie
        const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
        if (!sessionCookie) {
            return null;
        }

        // Verify session
        const decodedToken = await verifySessionCookie(sessionCookie);
        if (!decodedToken) {
            return null;
        }

        // Get user from database
        const user = await getUserWithClaims(decodedToken.uid);
        return user;
    } catch (error) {
        console.error('Error getting user from request:', error);
        return null;
    }
}
