import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("../../../../lib/auth-server");
        const { FieldOfficerService } = await import("../../../../src/services/FieldOfficerService");
        const { query } = await import("../../../../src/db/query");

        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId') || undefined;

        let sql = `
            SELECT fr.*, 
                   t.name as tenantName, 
                   u.firstName as submittedByFirstName, u.lastName as submittedByLastName, u.email as submittedByEmail,
                   v.scheduledDate as visitScheduledDate, v.status as visitStatus
            FROM field_reports fr
            LEFT JOIN tenants t ON t.id = fr.tenantId
            LEFT JOIN users u ON u.id = fr.submittedById
            LEFT JOIN field_visits v ON v.id = fr.visitId
        `;
        const params: any[] = [];

        if (tenantId) {
            sql += ' WHERE fr.tenantId = ?';
            params.push(tenantId);
        }

        sql += ' ORDER BY fr.createdAt DESC';

        const results = await query(sql, params) as any[];

        // Map back to expected structure
        const reports = results.map(r => ({
            ...r,
            tenant: r.tenantName ? { id: r.tenantId, name: r.tenantName } : null,
            submittedBy: r.submittedByFirstName ? { id: r.submittedById, firstName: r.submittedByFirstName, lastName: r.submittedByLastName, email: r.submittedByEmail } : null,
            visit: r.visitId ? { id: r.visitId, scheduledDate: r.visitScheduledDate, status: r.visitStatus } : null,
        }));

        return NextResponse.json(reports);
    } catch (error: any) {
        console.error('Field reports GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("../../../../lib/auth-server");
        const { FieldOfficerService } = await import("../../../../src/services/FieldOfficerService");
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
