import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
    try {
        // Clear session cookie
        await clearSessionCookie();

        const response = NextResponse.json({ success: true });

        // Delete the session cookie
        response.cookies.delete('session');

        return response;
    } catch (error: any) {
        console.error('Sign out error:', error);
        return NextResponse.json(
            { error: error.message || 'Sign out failed' },
            { status: 500 }
        );
    }
}
