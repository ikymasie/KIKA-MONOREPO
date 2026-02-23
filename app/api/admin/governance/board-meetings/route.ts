import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listBoardMinutes, createBoardMinute } from '@/src/db/services/GovernanceService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const minutes = await listBoardMinutes(user.tenantId);
        return NextResponse.json(minutes);
    } catch (error: any) {
        console.error('Board Minutes GET error:', error);
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
        const { meetingDate, startTime, endTime, location, attendees, agenda, decisions, documentUrl, notes } = body;

        if (!meetingDate) {
            return NextResponse.json({ error: 'Meeting date is required' }, { status: 400 });
        }

        const minute = await createBoardMinute(user.tenantId, {
            meetingDate,
            startTime,
            endTime,
            location,
            attendees,
            agenda,
            decisions,
            documentUrl,
            notes,
        });

        return NextResponse.json(minute, { status: 201 });
    } catch (error: any) {
        console.error('Board Minutes POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
