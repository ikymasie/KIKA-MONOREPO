import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/src/services/RegistrationService';
import { getUserFromRequest } from '@/lib/auth-server';
import { UserRole } from '@/src/entities/User';

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Minister Delegate can view ministerial appeals
        if (user.role !== UserRole.MINISTER_DELEGATE) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const appeals = await RegistrationService.getPendingAppeals();
        return NextResponse.json(appeals);
    } catch (error: any) {
        console.error('[MINISTER_APPEALS_GET]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Minister Delegate can decide on these appeals
        if (user.role !== UserRole.MINISTER_DELEGATE) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await req.json();
        const { applicationId, decision, notes } = body;

        if (!applicationId || !decision || !notes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (decision !== 'APPROVE' && decision !== 'REJECT') {
            return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
        }

        const application = await RegistrationService.handleAppeal(applicationId, user.id, decision, notes);

        return NextResponse.json({
            message: `Appeal ${decision.toLowerCase()}d successfully`,
            application
        });
    } catch (error: any) {
        console.error('[MINISTER_APPEALS_POST]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
