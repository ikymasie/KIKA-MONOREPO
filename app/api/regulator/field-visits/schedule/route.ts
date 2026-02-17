import { NextRequest, NextResponse } from 'next/server';
import { FieldOfficerService } from '@/src/services/FieldOfficerService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const visit = await FieldOfficerService.scheduleVisit({
            tenantId: body.tenantId,
            officerId: body.officerId,
            scheduledDate: new Date(body.scheduledDate),
            purpose: body.purpose,
            notes: body.notes,
        });
        return NextResponse.json(visit);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const officerId = searchParams.get('officerId');
        const tenantId = searchParams.get('tenantId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (startDate && endDate) {
            const visits = await FieldOfficerService.getCalendarVisits({
                officerId: officerId || undefined,
                tenantId: tenantId || undefined,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            });
            return NextResponse.json(visits);
        }

        const visits = await FieldOfficerService.getVisits({
            officerId: officerId || undefined,
            tenantId: tenantId || undefined,
        });
        return NextResponse.json(visits);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
