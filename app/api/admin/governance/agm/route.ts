import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { AgmResolution } = await import('@/src/entities/AgmResolution');
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const repo = AppDataSource.getRepository(AgmResolution);
        const resolutions = await repo.find({
            where: { tenantId: user.tenantId },
            order: { year: 'DESC', date: 'DESC' },
        });

        return NextResponse.json(resolutions);
    } catch (error: any) {
        console.error('AGM Resolutions GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AppDataSource } = await import('@/src/config/database');
        const { AgmResolution } = await import('@/src/entities/AgmResolution');

        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { year, date, title, description, status, meetingMinutesUrl } = body;

        if (!year || !date || !title || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const repo = AppDataSource.getRepository(AgmResolution);
        const resolution = repo.create({
            tenantId: user.tenantId,
            year,
            date: new Date(date),
            title,
            description,
            status: status || 'pending',
            meetingMinutesUrl,
        });

        await repo.save(resolution);

        return NextResponse.json(resolution, { status: 201 });
    } catch (error: any) {
        console.error('AGM Resolutions POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
