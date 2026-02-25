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
        const { effectiveDate, notes } = body;

        const bylaw = await queryOne<any>('SELECT * FROM bylaws WHERE id = ?', [params.id]);
        if (!bylaw) return NextResponse.json({ error: 'Bylaw not found' }, { status: 404 });
        if (bylaw.status !== BylawStatus.PENDING) return NextResponse.json({ error: 'Bylaw has already been processed' }, { status: 400 });

        const effectiveDateValue = effectiveDate ? new Date(effectiveDate) : new Date();

        await execute(
            'UPDATE bylaws SET status = ?, approvedBy = ?, approvedDate = NOW(), effectiveDate = ?, notes = ?, updatedAt = NOW() WHERE id = ?',
            [BylawStatus.APPROVED, user.id, effectiveDateValue, notes || null, params.id]
        );

        const { notificationService } = await import('@/lib/notification-service');
        const { NotificationEvent } = await import('@/lib/notification-types');
        await notificationService.sendNotification({
            event: NotificationEvent.SACCOS_SYSTEM_ALERT,
            recipientRole: UserRole.SACCOS_ADMIN,
            tenantId: bylaw.tenantId,
            data: { bylawId: bylaw.id, bylawVersion: bylaw.version, status: 'APPROVED', effectiveDate: effectiveDateValue, notes }
        });

        return NextResponse.json(await queryOne<any>('SELECT * FROM bylaws WHERE id = ?', [params.id]));
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to approve bylaw', details: error.message }, { status: 500 });
    }
}
