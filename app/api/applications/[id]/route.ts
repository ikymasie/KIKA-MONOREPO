import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        let application;
        if (user.isGovernmentOfficer() || user.isRegulator()) {
            application = await SocietyApplicationService.getApplicationById(id);
        } else {
            application = await SocietyApplicationService.getApplicantApplication(id, user.id);
        }

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json(application);
    } catch (error: any) {
        console.error('Error fetching application:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();

        const application = await SocietyApplicationService.updateApplication(id, body, user.id);

        return NextResponse.json(application);
    } catch (error: any) {
        console.error('Error updating application:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
