import { NextRequest, NextResponse } from 'next/server';
import { ComplianceService } from '@/src/services/ComplianceService';
import { AppDataSource } from '@/src/config/database';
import { ComplianceAudit } from '@/src/entities/ComplianceAudit';

export async function GET(req: NextRequest) {
    try {
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
