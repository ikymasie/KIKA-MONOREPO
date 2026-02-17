import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { FieldOfficerService } from '@/src/services/FieldOfficerService';
import { FieldVisitStatus } from '@/src/entities/FieldVisit';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const officerId = searchParams.get('officerId') || undefined;
        const tenantId = searchParams.get('tenantId') || undefined;
        const status = (searchParams.get('status') as FieldVisitStatus) || undefined;

        const visits = await FieldOfficerService.getVisits({ officerId, tenantId, status });

        return NextResponse.json(visits);
    } catch (error: any) {
        console.error('Field visits GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await request.json();
        const visit = await FieldOfficerService.scheduleVisit({
            ...data,
            officerId: user.id, // Assign the current user as the officer
            scheduledDate: new Date(data.scheduledDate),
        });

        return NextResponse.json(visit, { status: 201 });
    } catch (error: any) {
        console.error('Field visits POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
