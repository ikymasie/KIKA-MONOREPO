import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { BoardMinute } from '@/src/entities/BoardMinute';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const repo = AppDataSource.getRepository(BoardMinute);
        const minutes = await repo.find({
            where: { tenantId: user.tenantId },
            order: { meetingDate: 'DESC' },
        });

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

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const repo = AppDataSource.getRepository(BoardMinute);
        const minute = repo.create({
            tenantId: user.tenantId,
            meetingDate: new Date(meetingDate),
            startTime,
            endTime,
            location,
            attendees,
            agenda,
            decisions,
            documentUrl,
            notes,
        });

        await repo.save(minute);

        return NextResponse.json(minute, { status: 201 });
    } catch (error: any) {
        console.error('Board Minutes POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
