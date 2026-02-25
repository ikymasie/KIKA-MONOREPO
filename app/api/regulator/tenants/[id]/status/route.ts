import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');

        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { status, reason, effectiveDate } = body;

        if (!status || !reason) {
            return NextResponse.json({ error: 'Missing required fields: status, reason' }, { status: 400 });
        }

        const tenant = await queryOne<any>('SELECT * FROM tenants WHERE id = ?', [params.id]);
        if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });

        const previousStatus = tenant.status;
        const logId = uuidv4();
        const effectiveDateValue = effectiveDate ? new Date(effectiveDate) : new Date();

        await execute(
            `INSERT INTO tenant_status_logs (id, tenantId, previousStatus, newStatus, reason, changedBy, changedAt, effectiveDate, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, NOW())`,
            [logId, params.id, previousStatus, status, reason, user.id, effectiveDateValue]
        );

        await execute('UPDATE tenants SET status = ?, updatedAt = NOW() WHERE id = ?', [status, params.id]);

        const { notificationService } = await import('@/lib/notification-service');
        const { NotificationEvent } = await import('@/lib/notification-types');

        await notificationService.sendNotification({
            event: NotificationEvent.SACCOS_SYSTEM_ALERT,
            recipientRole: UserRole.SACCOS_ADMIN,
            tenantId: tenant.id,
            data: { tenantName: tenant.name, newStatus: status, reason, effectiveDate: effectiveDateValue.toISOString() }
        });

        const updatedTenant = await queryOne<any>('SELECT * FROM tenants WHERE id = ?', [params.id]);
        const statusLog = await queryOne<any>('SELECT * FROM tenant_status_logs WHERE id = ?', [logId]);

        return NextResponse.json({ tenant: updatedTenant, statusLog });
    } catch (error: any) {
        console.error('Error updating tenant status:', error);
        return NextResponse.json({ error: 'Failed to update tenant status', details: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');

        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const statusHistory = await query<any>(
            'SELECT * FROM tenant_status_logs WHERE tenantId = ? ORDER BY changedAt DESC',
            [params.id]
        );

        return NextResponse.json(statusHistory);
    } catch (error: any) {
        console.error('Error fetching status history:', error);
        return NextResponse.json({ error: 'Failed to fetch status history', details: error.message }, { status: 500 });
    }
}
