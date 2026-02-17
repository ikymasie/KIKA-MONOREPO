import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { SocietyApplicationService } from '@/src/services/SocietyApplicationService';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || (!user.isGovernmentOfficer() && !user.isRegulator())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { applicationId, isIncomplete, notes, documentChecks } = body;

        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        // 1. Update individual document verification statuses if provided
        if (documentChecks && Array.isArray(documentChecks)) {
            for (const check of documentChecks) {
                await SocietyApplicationService.verifyDocument(
                    check.documentId,
                    check.isVerified,
                    user.id
                );
            }
        }

        // 2. Complete the intake phase
        const application = await SocietyApplicationService.completeRegistryIntake(
            applicationId,
            user.id,
            isIncomplete,
            notes
        );

        return NextResponse.json(application);
    } catch (error: any) {
        console.error('Error in completeness check:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
