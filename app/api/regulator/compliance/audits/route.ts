import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { ComplianceService } = await import("@/src/services/ComplianceService");
        const { query } = await import("@/src/db/query");

        const results = await query(`
            SELECT a.*, 
                   t.name as tenantName, 
                   u.firstName as auditorFirstName, u.lastName as auditorLastName, u.email as auditorEmail
            FROM compliance_audits a
            LEFT JOIN tenants t ON t.id = a.tenantId
            LEFT JOIN users u ON u.id = a.auditorId
            ORDER BY a.scheduledDate DESC
        `) as any[];

        const audits = results.map(a => ({
            ...a,
            tenant: a.tenantName ? { id: a.tenantId, name: a.tenantName } : null,
            auditor: a.auditorFirstName ? { id: a.auditorId, firstName: a.auditorFirstName, lastName: a.auditorLastName, email: a.auditorEmail } : null
        }));
        return NextResponse.json(audits);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { ComplianceService } = await import("@/src/services/ComplianceService");
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
