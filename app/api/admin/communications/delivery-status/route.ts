import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { NotificationLog } = await import('@/src/entities/NotificationLog');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Aggregate notification statuses for this tenant
        // We'll focus on status counts for the last 7 days
        const statusAggregates = await AppDataSource.query(`
            SELECT status, channel, COUNT(*) as count
            FROM notification_logs
            WHERE tenantId = ? AND sentAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY status, channel
        `, [user.tenantId]);

        // Get recent delivery failures
        const recentFailures = await AppDataSource.getRepository(NotificationLog).find({
            where: {
                tenantId: user.tenantId,
                status: 'failed' as any
            },
            order: { sentAt: 'DESC' },
            take: 10
        });

        // Calculate delivery rate
        const totalSent = statusAggregates.reduce((acc: number, curr: any) => acc + Number(curr.count), 0);
        const successful = statusAggregates
            .filter((s: any) => s.status === 'sent')
            .reduce((acc: number, curr: any) => acc + Number(curr.count), 0);

        return NextResponse.json({
            statusAggregates,
            recentFailures,
            overview: {
                totalInLast7Days: totalSent,
                deliveryRate: totalSent > 0 ? (successful / totalSent) * 100 : 0,
                pendingCount: statusAggregates
                    .filter((s: any) => s.status === 'pending')
                    .reduce((acc: number, curr: any) => acc + Number(curr.count), 0),
                failedCount: statusAggregates
                    .filter((s: any) => s.status === 'failed')
                    .reduce((acc: number, curr: any) => acc + Number(curr.count), 0),
            }
        });
    } catch (error: any) {
        console.error('Delivery status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
