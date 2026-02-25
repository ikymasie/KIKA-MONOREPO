import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { BroadcastType, BroadcastPriority, BroadcastTargetAudience } from '@/src/entities/RegulatoryBroadcast';
import { UserRole } from '@/src/entities/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isRegulator()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const broadcastType = searchParams.get('broadcastType');
        const priority = searchParams.get('priority');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM regulatory_broadcasts WHERE 1=1';
        const params: any[] = [];

        if (broadcastType) { sql += ' AND broadcastType = ?'; params.push(broadcastType); }
        if (priority) { sql += ' AND priority = ?'; params.push(priority); }

        const countResult = await queryOne<any>('SELECT COUNT(*) as total FROM regulatory_broadcasts WHERE 1=1' + (broadcastType ? ' AND broadcastType = ?' : '') + (priority ? ' AND priority = ?' : ''), params);
        const broadcasts = await query<any>(sql + ' ORDER BY publishedAt DESC LIMIT ? OFFSET ?', [...params, limit, offset]);

        return NextResponse.json({ broadcasts, pagination: { page, limit, total: Number(countResult?.total || 0), totalPages: Math.ceil(Number(countResult?.total || 0) / limit) } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch broadcasts', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { title, content, broadcastType, priority, targetAudience, targetTenantIds, deliveryChannels, expiresAt } = body;

        if (!title || !content || !broadcastType) {
            return NextResponse.json({ error: 'Missing required fields: title, content, broadcastType' }, { status: 400 });
        }

        const broadcastId = uuidv4();
        const deliveryStatus = {};

        await execute(
            `INSERT INTO regulatory_broadcasts 
             (id, title, content, broadcastType, priority, targetAudience, targetTenantIds, createdBy, publishedAt, expiresAt, deliveryChannels, deliveryStatus, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, NOW(), NOW())`,
            [
                broadcastId, title, content, broadcastType,
                priority || BroadcastPriority.MEDIUM,
                targetAudience || BroadcastTargetAudience.ALL_TENANTS,
                targetTenantIds ? JSON.stringify(targetTenantIds) : null,
                user.id, expiresAt ? new Date(expiresAt) : null,
                JSON.stringify(deliveryChannels || ['in_app']),
                JSON.stringify(deliveryStatus)
            ]
        );

        // Determine recipients
        let recipients: any[] = [];
        if (targetAudience === BroadcastTargetAudience.ALL_TENANTS || !targetAudience) {
            recipients = await query<any>('SELECT * FROM users WHERE role = ?', [UserRole.SACCOS_ADMIN]);
        } else if (targetAudience === BroadcastTargetAudience.SPECIFIC_TENANTS && targetTenantIds?.length) {
            const placeholders = targetTenantIds.map(() => '?').join(',');
            recipients = await query<any>(`SELECT * FROM users WHERE role = ? AND tenantId IN (${placeholders})`, [UserRole.SACCOS_ADMIN, ...targetTenantIds]);
        }

        if (recipients.length > 0) {
            const { notificationService } = await import('@/lib/notification-service');
            const { NotificationEvent } = await import('@/lib/notification-types');
            const contexts = recipients.map((recipient: any) => ({
                event: NotificationEvent.SACCOS_SYSTEM_ALERT,
                recipientRole: recipient.role,
                recipientEmail: recipient.email,
                recipientPhone: recipient.phone,
                recipientName: recipient.fullName,
                userId: recipient.id,
                tenantId: recipient.tenantId,
                data: { title, content, broadcastType, priority }
            }));
            await notificationService.sendBulkNotifications(contexts);

            const updatedDeliveryStatus = {
                email: { sent: recipients.length, failed: 0, total: recipients.length },
                sms: { sent: recipients.length, failed: 0, total: recipients.length },
                inApp: { created: recipients.length, total: recipients.length },
            };
            await execute('UPDATE regulatory_broadcasts SET deliveryStatus = ? WHERE id = ?', [JSON.stringify(updatedDeliveryStatus), broadcastId]);
        }

        const broadcast = await queryOne<any>('SELECT * FROM regulatory_broadcasts WHERE id = ?', [broadcastId]);
        return NextResponse.json(broadcast, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create broadcast', details: error.message }, { status: 500 });
    }
}
