import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/src/services/RegistrationService';
import { getUserFromRequest } from '@/lib/auth-utils/server';
import { UserRole } from '@/src/entities/User';

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Registrar or Director can issue certificates
        if (user.role !== UserRole.REGISTRAR && user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const body = await req.json();
        const { applicationId } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
        }

        const certificate = await RegistrationService.issueCertificate(applicationId, user.id);

        return NextResponse.json({
            message: 'Certificate issued successfully',
            certificate
        });
    } catch (error: any) {
        console.error('[Certificate Issue Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
