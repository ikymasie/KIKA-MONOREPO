import { NextRequest, NextResponse } from 'next/server';
import { FieldOfficerService } from '@/src/services/FieldOfficerService';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { visitId, latitude, longitude } = body;

        if (!visitId || latitude === undefined || longitude === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const visit = await FieldOfficerService.logGeolocation(visitId, latitude, longitude);
        return NextResponse.json(visit);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
