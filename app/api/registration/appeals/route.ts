import { NextRequest, NextResponse } from 'next/server';


export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { RegistrationService } = await import('@/src/services/RegistrationService');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Director or Minister Delegate can view appeals
        if (user.role !== UserRole.DIRECTOR_COOPERATIVES && user.role !== UserRole.MINISTER_DELEGATE) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const appeals = await RegistrationService.getPendingAppeals();
        return NextResponse.json(appeals);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { RegistrationService } = await import('@/src/services/RegistrationService');
        const { UserRole } = await import('@/src/entities/User');
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Director or Minister Delegate can decide on appeals
        if (user.role !== UserRole.DIRECTOR_COOPERATIVES && user.role !== UserRole.MINISTER_DELEGATE) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await req.json();
        const { applicationId, decision, notes } = body;

        if (!applicationId || !decision || !notes) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const application = await RegistrationService.handleAppeal(applicationId, user.id, decision, notes);

        return NextResponse.json({
            message: `Appeal ${decision.toLowerCase()}d successfully`,
            application
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
