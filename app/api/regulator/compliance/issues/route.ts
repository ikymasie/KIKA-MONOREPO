import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { ComplianceIssueStatus } from '@/src/entities/ComplianceIssue';
import { UserRole } from '@/src/entities/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isRegulator()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('tenantId');
        const severity = searchParams.get('severity');
        const status = searchParams.get('status');
        const issueType = searchParams.get('issueType');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = 'WHERE 1=1';
        const params: any[] = [];
        if (tenantId) { where += ' AND i.tenantId = ?'; params.push(tenantId); }
        if (severity) { where += ' AND i.severity = ?'; params.push(severity); }
        if (status) { where += ' AND i.status = ?'; params.push(status); }
        if (issueType) { where += ' AND i.issueType = ?'; params.push(issueType); }

        const countResult = await queryOne<any>(`SELECT COUNT(*) as total FROM compliance_issues i ${where}`, params);
        const issues = await query<any>(
            `SELECT i.*, t.name as tenantName FROM compliance_issues i LEFT JOIN tenants t ON i.tenantId = t.id ${where} ORDER BY i.identifiedDate DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return NextResponse.json({ issues, pagination: { page, limit, total: Number(countResult?.total || 0), totalPages: Math.ceil(Number(countResult?.total || 0) / limit) } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch compliance issues', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isRegulator()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { tenantId, issueType, severity, description, attachments } = body;
        if (!tenantId || !issueType || !severity || !description) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

        const id = uuidv4();
        await execute(
            'INSERT INTO compliance_issues (id, tenantId, issueType, severity, description, identifiedBy, identifiedDate, status, attachments, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, NOW(), NOW())',
            [id, tenantId, issueType, severity, description, user.id, ComplianceIssueStatus.OPEN, attachments ? JSON.stringify(attachments) : null]
        );

        const { notificationService } = await import('@/lib/notification-service');
        const { NotificationEvent } = await import('@/lib/notification-types');
        await notificationService.sendNotification({
            event: NotificationEvent.SACCOS_SYSTEM_ALERT,
            recipientRole: UserRole.SACCOS_ADMIN,
            tenantId,
            data: { issueType, severity, description }
        });

        return NextResponse.json(await queryOne<any>('SELECT * FROM compliance_issues WHERE id = ?', [id]), { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create compliance issue', details: error.message }, { status: 500 });
    }
}
