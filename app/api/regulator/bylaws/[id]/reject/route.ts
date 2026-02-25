import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/src/db/query';
import { BylawStatus } from '@/src/entities/Bylaw';
import { UserRole } from '@/src/entities/User';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { reason, requiredChanges } = body;
        if (!reason) return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });

        const bylaw = await queryOne<any>('SELECT * FROM bylaws WHERE id = ?', [params.id]);
        if (!bylaw) return NextResponse.json({ error: 'Bylaw not found' }, { status: 404 });
        if (bylaw.status !== BylawStatus.PENDING) return NextResponse.json({ error: 'Bylaw has already been processed' }, { status: 400 });

        await execute(
            'UPDATE bylaws SET status = ?, approvedBy = ?, approvedDate = NOW(), rejectionReason = ?, notes = ?, updatedAt = NOW() WHERE id = ?',
            [BylawStatus.REJECTED, user.id, reason, requiredChanges || null, params.id]
        );

        const { notificationService } = await import('@/lib/notification-service');
        const { NotificationEvent } = await import('@/lib/notification-types');
        await notificationService.sendNotification({
            event: NotificationEvent.SACCOS_SYSTEM_ALERT,
            recipientRole: UserRole.SACCOS_ADMIN,
            tenantId: bylaw.tenantId,
            data: { bylawId: bylaw.id, bylawVersion: bylaw.version, status: 'REJECTED', rejectionReason: reason, requiredChanges }
        });

        return NextResponse.json(await queryOne<any>('SELECT * FROM bylaws WHERE id = ?', [params.id]));
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to reject bylaw', details: error.message }, { status: 500 });
    }
}
