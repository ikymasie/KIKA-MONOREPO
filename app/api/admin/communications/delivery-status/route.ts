import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import('@/src/db/query');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }



        // Aggregate notification statuses for this tenant
        // We'll focus on status counts for the last 7 days
        const statusAggregates = await query(`
            SELECT status, channel, COUNT(*) as count
            FROM notification_logs
            WHERE tenantId = ? AND sentAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY status, channel
        `, [user.tenantId]) as any[];

        // Get recent delivery failures
        const recentFailures = await query(`
            SELECT * FROM notification_logs
            WHERE tenantId = ? AND status = 'failed'
            ORDER BY sentAt DESC
            LIMIT 10
        `, [user.tenantId]) as any[];

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
