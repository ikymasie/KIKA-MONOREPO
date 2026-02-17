import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/src/services/RegistrationService';
import { getUserFromRequest } from '@/lib/auth-server';
import { UserRole } from '@/src/entities/User';

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only Minister Delegate can use this endpoint
        if (user.role !== UserRole.MINISTER_DELEGATE) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await req.json();
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
