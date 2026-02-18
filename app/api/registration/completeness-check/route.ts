import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');

    
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
