import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { FieldOfficerService } from '@/src/services/FieldOfficerService';
import { InvestigationStatus } from '@/src/entities/Investigation';

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
        const status = (searchParams.get('status') as InvestigationStatus) || undefined;

        const investigations = await FieldOfficerService.getInvestigations({ officerId, tenantId, status });

        return NextResponse.json(investigations);
    } catch (error: any) {
        console.error('Investigations GET error:', error);
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
        const investigation = await FieldOfficerService.initiateInvestigation({
            ...data,
            officerId: user.id,
        });

        return NextResponse.json(investigation, { status: 201 });
    } catch (error: any) {
        console.error('Investigations POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
