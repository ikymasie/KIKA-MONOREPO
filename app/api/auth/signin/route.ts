import { NextRequest, NextResponse } from 'next/server';
import { createSessionCookie } from '@/lib/auth-server';
import { adminAuth } from '@/lib/firebase-admin';
import mysql from 'mysql2/promise';

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json(
                { error: 'ID token is required' },
                { status: 400 }
            );
        }

        // Verify the ID token
        const decodedToken = await adminAuth.verifyIdToken(idToken);

        // Create direct MySQL connection (avoiding TypeORM circular dependency)
        const connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        });

        try {
            // Query user from database
            const [rows] = await connection.execute(
                'SELECT id, email, firstName, lastName, role, tenantId, firebaseUid, status FROM users WHERE firebaseUid = ?',
                [decodedToken.uid]
            );

            const users = rows as any[];

            if (!users || users.length === 0) {
                return NextResponse.json(
                    { error: 'User not found in database' },
                    { status: 404 }
                );
            }

            const user = users[0];

            if (user.status !== 'active') {
                return NextResponse.json(
                    { error: 'Account is not active' },
                    { status: 403 }
                );
            }

            // Create session cookie
            const sessionCookie = await createSessionCookie(idToken);

            // Create response with user data
            const response = NextResponse.json({
                user: {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    tenantId: user.tenantId,
                    firebaseUid: user.firebaseUid,
                },
            });

            // Set session cookie
            response.cookies.set('session', sessionCookie, {
                maxAge: parseInt(process.env.FIREBASE_SESSION_COOKIE_MAX_AGE || '604800'),
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
            });

            return response;
        } finally {
            await connection.end();
        }
    } catch (error: any) {
        console.error('Sign in error:', error);
        return NextResponse.json(
            { error: error.message || 'Sign in failed' },
            { status: 401 }
        );
    }
}
