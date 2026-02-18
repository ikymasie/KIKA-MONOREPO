import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { BoardMinute } = await import('@/src/entities/BoardMinute');
        const { getUserFromRequest } = await import('@/lib/auth-server');

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
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AppDataSource } = await import('@/src/config/database');
        const { BoardMinute } = await import('@/src/entities/BoardMinute');

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
