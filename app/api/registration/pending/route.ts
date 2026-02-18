import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
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

        if (user.role !== UserRole.REGISTRAR && user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const applications = await RegistrationService.getPendingDecisions();

        return NextResponse.json(applications);
    } catch (error: any) {
        console.error('[Pending Decisions GET Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
