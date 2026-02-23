import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { AuditorService } from '@/src/services/AuditorService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'external_auditor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const auditorService = new AuditorService();
        const requests = await auditorService.getAuditorAccess(user.id);

        return NextResponse.json(requests);
    } catch (error: any) {
        console.error('Error fetching access requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'external_auditor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tenantId, startDate, endDate, purpose } = body;

        if (!tenantId || !startDate || !endDate || !purpose) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const auditorService = new AuditorService();
        const accessRequest = await auditorService.createAccessRequest({
            auditorId: user.id,
            tenantId,
            startDate,
            endDate,
            purpose,
        });

        return NextResponse.json(accessRequest, { status: 201 });
    } catch (error: any) {
        console.error('Error creating access request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
