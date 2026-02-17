import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { FieldOfficerService } from '@/src/services/FieldOfficerService';
import { AppDataSource } from '@/src/config/database';
import { FieldReport } from '@/src/entities/FieldReport';

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
