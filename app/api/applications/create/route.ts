import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const { ApplicationType } = await import('@/src/entities/SocietyApplication');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { applicationType, proposedName, primaryContactName, primaryContactEmail, primaryContactPhone, physicalAddress } = body;

        if (!applicationType || !proposedName || !primaryContactName || !primaryContactEmail || !primaryContactPhone || !physicalAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const application = await SocietyApplicationService.createApplication({
            applicationType: applicationType as any,
            proposedName,
            primaryContactName,
            primaryContactEmail,
            primaryContactPhone,
            physicalAddress
        }, user);

        return NextResponse.json(application, { status: 201 });
    } catch (error: any) {
        console.error('Error creating application:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
