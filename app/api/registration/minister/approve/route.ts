import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
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

        // Only Minister Delegate can use this endpoint
        if (user.role !== UserRole.MINISTER_DELEGATE) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await request.json();
        const { applicationId, notes } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        // For ministerial approval, we use the RegistrationService.approveApplication logic
        // but it might be tied to 'registrar' role in some internal checks. 
        // Let's check RegistrationService.approveApplication implementation.

        const application = await RegistrationService.approveApplication(applicationId, user.id, notes);

        return NextResponse.json({
            message: 'Application approved successfully by Minister Delegate',
            application
        });
    } catch (error: any) {
        console.error('[MINISTER_APPROVE_POST]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
