import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');


        const user = await getUserFromRequest(request);
        if (!user || (!user.isGovernmentOfficer() && !user.isRegulator())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const communications = await SocietyApplicationService.getCommunications(params.id);
        return NextResponse.json(communications);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SocietyApplicationService } = await import('@/src/services/SocietyApplicationService');
        const user = await getUserFromRequest(request);
        if (!user || (!user.isGovernmentOfficer() && !user.isRegulator())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const communication = await SocietyApplicationService.logCommunication(params.id, {
            ...body,
            recordedById: user.id
        });

        return NextResponse.json(communication);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
