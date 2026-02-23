import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import('@/src/db/query');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is regulator
        if (!user.isRegulator()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const allSaccos = await query('SELECT * FROM tenants ORDER BY name ASC') as any[];

        // Build member counts lookup
        const memberCountsResults = await query('SELECT tenantId, COUNT(*) as count FROM members WHERE status = ? GROUP BY tenantId', ['active']) as any[];
        const memberCountsMap = new Map();
        for (const row of memberCountsResults) {
            memberCountsMap.set(row.tenantId, parseInt(row.count || '0', 10));
        }

        // Combine
        const saccosWithCounts = allSaccos.map((saccos) => {
            return {
                id: saccos.id,
                name: saccos.name,
                code: saccos.code,
                status: saccos.status,
                registrationDate: saccos.registrationDate,
                phone: saccos.phone,
                email: saccos.email,
                memberCount: memberCountsMap.get(saccos.id) || 0,
            };
        });

        return NextResponse.json({
            saccos: saccosWithCounts,
        });
    } catch (error: any) {
        console.error('SACCOS directory error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch SACCOS' },
            { status: 500 }
        );
    }
}
