import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { RegistrationService } = await import('@/src/services/RegistrationService');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Director of Cooperatives can perform this high-level approval
        if (user.role !== UserRole.DIRECTOR_COOPERATIVES) {
            return NextResponse.json({ error: 'Permission denied. Only Director of Cooperatives can perform this action.' }, { status: 403 });
        }

        const body = await request.json();
        const { applicationId, notes } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
        }

        // Using standard approval logic for now, can be specialized if needed
        const application = await RegistrationService.approveApplication(applicationId, user.id, notes);

        return NextResponse.json({
            message: 'High-level Director approval granted successfully',
            application
        });
    } catch (error: any) {
        console.error('[Director Approve Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
