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

        // Only Registrar or Director can perform final approval
        if (user.role !== UserRole.REGISTRAR && user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Permission denied. Only Registrar or Director can perform this action.' }, { status: 403 });
        }

        const body = await req.json();
        const { applicationId, notes } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
        }

        const application = await RegistrationService.approveApplication(applicationId, user.id, notes);

        return NextResponse.json({
            message: 'Application approved successfully',
            application
        });
    } catch (error: any) {
        console.error('[Registration Approve Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
