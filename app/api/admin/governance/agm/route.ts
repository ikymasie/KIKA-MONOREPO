import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listAgmResolutions, createAgmResolution } from '@/src/db/services/GovernanceService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolutions = await listAgmResolutions(user.tenantId);
        return NextResponse.json(resolutions);
    } catch (error: any) {
        console.error('AGM Resolutions GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { year, date, title, description, status, meetingMinutesUrl, metadata } = body;

        if (!year || !date || !title || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const resolution = await createAgmResolution(user.tenantId, {
            year,
            date,
            title,
            description,
            status,
            meetingMinutesUrl,
            metadata
        });

        return NextResponse.json(resolution, { status: 201 });
    } catch (error: any) {
        console.error('AGM Resolutions POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
