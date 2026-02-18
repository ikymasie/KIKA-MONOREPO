import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { FieldOfficerService } = await import('@/src/services/FieldOfficerService');
        const { AppDataSource } = await import('@/src/config/database');
        const { FieldReport } = await import('@/src/entities/FieldReport');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId') || undefined;

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const reportRepo = AppDataSource.getRepository(FieldReport);
        const reports = await reportRepo.find({
            where: tenantId ? { tenantId } : {},
            relations: ['tenant', 'submittedBy', 'visit'],
            order: { createdAt: 'DESC' },
        });

        return NextResponse.json(reports);
    } catch (error: any) {
        console.error('Field reports GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { FieldOfficerService } = await import('@/src/services/FieldOfficerService');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const data = await request.json();
        const report = await FieldOfficerService.submitReport({
            ...data,
            submittedById: user.id,
        });

        return NextResponse.json(report, { status: 201 });
    } catch (error: any) {
        console.error('Field reports POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
