import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getSavingsPortfolioSummary } from '@/src/db/services/SavingsService';
import { query, queryOne } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        const offset = (page - 1) * limit;
        const search = searchParams.get('search') || '';

        const summary = await getSavingsPortfolioSummary(user.tenantId!);

        let whereClause = 'WHERE m.tenantId = ?';
        const params: any[] = [user.tenantId!];

        if (search) {
            whereClause += ' AND (m.firstName LIKE ? OR m.lastName LIKE ? OR m.memberNumber LIKE ?)';
            const likeTarget = `%${search}%`;
            params.push(likeTarget, likeTarget, likeTarget);
        }

        const countRow = await queryOne<RowDataPacket & { total: string }>(
            `SELECT COUNT(*) as total 
             FROM member_savings ms
             INNER JOIN members m ON m.id = ms.memberId
             INNER JOIN savings_products sp ON sp.id = ms.productId
             ${whereClause}`,
            params
        );
        const total = parseInt(countRow?.total ?? '0', 10);

        // Fetch full savings rows with member + product info
        const savings = await query<RowDataPacket>(
            `SELECT ms.*,
                    m.id AS memberId, m.firstName, m.lastName, m.memberNumber,
                    sp.name AS productName, sp.code AS productCode, sp.isShareCapital
             FROM member_savings ms
             INNER JOIN members m ON m.id = ms.memberId
             INNER JOIN savings_products sp ON sp.id = ms.productId
             ${whereClause}
             ORDER BY ms.createdAt DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return NextResponse.json({
            savings,
            metrics: {
                totalSavings: summary.totalBalance,
                totalShareCapital: summary.totalShareCapital,
                activeAccounts: summary.activeAccounts,
                totalAccounts: summary.totalAccounts,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching admin savings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
