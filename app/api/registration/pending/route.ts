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
