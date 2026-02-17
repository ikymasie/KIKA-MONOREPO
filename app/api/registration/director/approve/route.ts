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

        // Only Director of Cooperatives can perform this high-level approval
        if (user.role !== UserRole.DIRECTOR_COOPERATIVES) {
            return NextResponse.json({ error: 'Permission denied. Only Director of Cooperatives can perform this action.' }, { status: 403 });
        }

        const body = await req.json();
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
