import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenants = await query('SELECT * FROM tenants WHERE id = ?', [params.id]) as any[];
        const tenant = tenants[0];

        const body = await request.json();
        const { status } = body;

        if (!tenant) {
            return NextResponse.json({ error: 'SACCO not found' }, { status: 404 });
        }

        const previousStatus = tenant.status;
        await execute('UPDATE tenants SET status = ?, updatedAt = NOW() WHERE id = ?', [status, params.id]);

        // Audit Log via raw SQL
        await execute(
            `INSERT INTO audit_logs (id, tenantId, userId, userEmail, action, entityType, entityId, oldValues, newValues, description, ipAddress, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                uuidv4(), params.id, user.id, user.email, 'update', 'Tenant', params.id,
                JSON.stringify({ status: previousStatus }), JSON.stringify({ status }),
                `SACCO status changed from ${previousStatus} to ${status}`,
                request.headers.get('x-forwarded-for') || 'unknown'
            ]
        );

        const { notificationService } = await import('@/lib/notification-service');
        const { NotificationEvent } = await import('@/lib/notification-types');
        const { UserRole } = await import('@/src/entities/User');

        await notificationService.sendNotification({
            event: NotificationEvent.SACCOS_SYSTEM_ALERT,
            recipientRole: UserRole.SACCOS_ADMIN,
            tenantId: params.id,
            data: { tenantName: tenant.name, status, previousStatus }
        });

        return NextResponse.json({
            success: true,
            message: `SACCO ${status === 'active' ? 'activated' : 'suspended'} successfully`,
            tenant: { id: tenant.id, name: tenant.name, status, previousStatus }
        });

    } catch (error: any) {
        console.error('Error updating SACCO status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
