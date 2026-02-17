import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, createSessionCookie, getUserWithClaims } from '@/lib/auth-server';
import { adminAuth } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        return NextResponse.json({ user: session.user });
    } catch (error: any) {
        console.error('Get session error:', error);
        return NextResponse.json({ user: null }, { status: 200 });
    }
}

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

        // Get user from database
        const user = await getUserWithClaims(decodedToken.uid);

        if (!user) {
            return NextResponse.json(
                { error: 'User not found in database' },
                { status: 404 }
            );
        }

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
                name: user.fullName,
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
    } catch (error: any) {
        console.error('Create session error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create session' },
            { status: 401 }
        );
    }
}
