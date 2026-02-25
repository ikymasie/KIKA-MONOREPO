import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import("@/src/db/query");
        const { getUserFromRequest } = await import("@/lib/auth-server");


        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('q') || '';
        const status = searchParams.get('status');

        let sql = 'SELECT id, name, status, createdAt, registrationNumber FROM tenants';
        const params: any[] = [];
        const conditions: string[] = [];

        if (searchQuery) {
            conditions.push('(name LIKE ? OR registrationNumber LIKE ?)');
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        const tenants = await query(sql, params) as any[];

        // Enrich with stats (Member count, Assets)
        // This could be optimized with subqueries, but for now loop is acceptable for reasonable N or paginate
        const directoryData = await Promise.all(tenants.map(async (tenant) => {
            const [[memberCountResult]] = await query('SELECT COUNT(*) as count FROM members WHERE tenantId = ?', [tenant.id]) as any[];
            const memberCount = parseInt(memberCountResult?.count || '0', 10);

            // Total Assets = Sum of Savings Accounts (simplification)
            const [[assetsResult]] = await query('SELECT SUM(balance) as total FROM accounts WHERE tenantId = ?', [tenant.id]) as any[];
            const totalAssets = parseFloat(assetsResult?.total || '0');

            return {
                id: tenant.id,
                name: tenant.name,
                registrationNumber: tenant.registrationNumber || 'N/A',
                status: tenant.status,
                memberCount,
                totalAssets,
                joinedDate: tenant.createdAt
            };
        }));

        return NextResponse.json(directoryData);

    } catch (error: any) {
        console.error('Error fetching directory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
