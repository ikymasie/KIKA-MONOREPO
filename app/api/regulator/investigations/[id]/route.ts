import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { FieldOfficerService } = await import('@/src/services/FieldOfficerService');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = params;
        const data = await request.json();

        const investigation = await FieldOfficerService.updateInvestigation(id, data);

        return NextResponse.json(investigation);
    } catch (error: any) {
        console.error('Investigation PATCH error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
