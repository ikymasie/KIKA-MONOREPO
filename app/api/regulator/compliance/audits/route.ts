import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { ComplianceService } = await import('@/src/services/ComplianceService');
        const { AppDataSource } = await import('@/src/config/database');
        const { ComplianceAudit } = await import('@/src/entities/ComplianceAudit');


        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }
        const audits = await AppDataSource.getRepository(ComplianceAudit).find({
            relations: ['tenant', 'auditor'],
            order: { scheduledDate: 'DESC' }
        });
        return NextResponse.json(audits);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { ComplianceService } = await import('@/src/services/ComplianceService');
        const body = await req.json();
        const { tenantId, auditorId, scheduledDate } = body;

        if (!tenantId || !auditorId || !scheduledDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const audit = await ComplianceService.scheduleAudit(tenantId, auditorId, new Date(scheduledDate));
        return NextResponse.json(audit);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
