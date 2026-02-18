import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AuditorService } = await import('@/src/services/AuditorService');
        const { UserRole } = await import('@/src/entities/User');


        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.EXTERNAL_AUDITOR) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

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
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');
        const { AuditorService } = await import('@/src/services/AuditorService');
        const { AppDataSource } = await import('@/src/config/database');
        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.EXTERNAL_AUDITOR) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { tenantId, startDate, endDate, purpose } = body;

        if (!tenantId || !startDate || !endDate || !purpose) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const auditorService = new AuditorService();
        const accessRequest = await auditorService.createAccessRequest({
            auditorId: user.id,
            tenantId,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            purpose,
        });

        return NextResponse.json(accessRequest, { status: 201 });
    } catch (error: any) {
        console.error('Error creating access request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
