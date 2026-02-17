import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { User } from '@/src/entities/User';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const userRepo = db.getRepository(User);
        const currentUser = await userRepo.findOne({ where: { id: user.id } });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const defaultPreferences = {
            email: {
                loanUpdates: true,
                savingsUpdates: true,
                marketing: false,
                security: true
            },
            sms: {
                loanUpdates: true,
                savingsUpdates: false,
                security: true
            },
            push: {
                loanUpdates: true,
                savingsUpdates: true,
                security: true
            }
        };

        return NextResponse.json(currentUser.notificationPreferences || defaultPreferences);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const db = await getDb();
        const userRepo = db.getRepository(User);
        const currentUser = await userRepo.findOne({ where: { id: user.id } });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        currentUser.notificationPreferences = body;
        await userRepo.save(currentUser);

        return NextResponse.json(currentUser.notificationPreferences);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
