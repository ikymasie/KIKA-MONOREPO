import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/src/db/query';

export const dynamic = 'force-dynamic';

const defaultPreferences = {
    email: { loanUpdates: true, savingsUpdates: true, marketing: false, security: true },
    sms: { loanUpdates: true, savingsUpdates: false, security: true },
    push: { loanUpdates: true, savingsUpdates: true, security: true }
};

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const currentUser = await queryOne<any>(
            'SELECT id, notificationPreferences FROM users WHERE id = ?',
            [user.id]
        );

        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let prefs = defaultPreferences;
        if (currentUser.notificationPreferences) {
            try {
                prefs = typeof currentUser.notificationPreferences === 'string'
                    ? JSON.parse(currentUser.notificationPreferences)
                    : currentUser.notificationPreferences;
            } catch { prefs = defaultPreferences; }
        }

        return NextResponse.json(prefs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        const currentUser = await queryOne<any>(
            'SELECT id FROM users WHERE id = ?',
            [user.id]
        );
        if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        await execute(
            'UPDATE users SET notificationPreferences = ?, updatedAt = NOW() WHERE id = ?',
            [JSON.stringify(body), user.id]
        );

        return NextResponse.json(body);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
