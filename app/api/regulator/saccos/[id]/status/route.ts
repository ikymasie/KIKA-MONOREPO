import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { getDb } from '@/lib/db';
import { AuditLog, AuditAction } from '@/src/entities/AuditLog';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("@/lib/auth-server");
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

        // Audit Log
        const dataSource = await getDb();
        const auditRepo = dataSource.getRepository(AuditLog);
        await auditRepo.save({
            tenantId: params.id,
            userId: user.id,
            userEmail: user.email,
            action: AuditAction.UPDATE,
            entityType: 'Tenant',
            entityId: params.id,
            oldValues: { status: previousStatus },
            newValues: { status },
            description: `SACCO status changed from ${previousStatus} to ${status}`,
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        const { notificationService } = await import("@/lib/notification-service");
        const { NotificationEvent } = await import("@/lib/notification-types");
        const { UserRole } = await import("@/src/entities/User");

        // Send notification to SACCO administrators
        await notificationService.sendNotification({
            event: NotificationEvent.SACCOS_SYSTEM_ALERT,
            recipientRole: UserRole.SACCOS_ADMIN,
            tenantId: params.id,
            data: {
                tenantName: tenant.name,
                status: status,
                previousStatus: previousStatus
            }
        });

        return NextResponse.json({
            success: true,
            message: `SACCO ${status === 'active' ? 'activated' : 'suspended'} successfully`,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                status: status,
                previousStatus
            }
        });

    } catch (error: any) {
        console.error('Error updating SACCO status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
