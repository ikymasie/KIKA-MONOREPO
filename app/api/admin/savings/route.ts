import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getSavingsPortfolioSummary } from '@/src/db/services/SavingsService';
import { query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const summary = await getSavingsPortfolioSummary(user.tenantId!);

        // Fetch full savings rows with member + product info
        const savings = await query<RowDataPacket>(
            `SELECT ms.*,
                    m.id AS memberId, m.firstName, m.lastName, m.memberNumber,
                    sp.name AS productName, sp.code AS productCode, sp.isShareCapital
             FROM member_savings ms
             INNER JOIN members m ON m.id = ms.memberId
             INNER JOIN savings_products sp ON sp.id = ms.productId
             WHERE m.tenantId = ?
             ORDER BY ms.createdAt DESC`,
            [user.tenantId!]
        );

        return NextResponse.json({
            savings,
            metrics: {
                totalSavings: summary.totalBalance,
                totalShareCapital: summary.totalShareCapital,
                activeAccounts: summary.activeAccounts,
                totalAccounts: summary.totalAccounts,
            },
        });
    } catch (error: any) {
        console.error('Error fetching admin savings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
