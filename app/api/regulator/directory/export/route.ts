import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("@/lib/auth-server");
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        let sql = `
            SELECT t.id, t.name, t.registrationNumber, t.status, t.address, t.createdAt,
                   u.email as contactEmail, u.phone as contactPhone
            FROM tenants t
            LEFT JOIN users u ON u.tenantId = t.id AND u.role = 'admin' /* assuming first user or admin as contact */
        `;
        const params: any[] = [];
        const conditions: string[] = [];

        if (search) {
            conditions.push('(t.name ILIKE ? OR t.registrationNumber ILIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        // Group by to ensure single row per tenant if multiple admins
        sql += ' GROUP BY t.id';

        const tenants = await query(sql, params) as any[];

        // Get member counts and total assets for each tenant
        const enrichedData = await Promise.all(
            tenants.map(async (tenant) => {
                const [[memberCountResult]] = await query('SELECT COUNT(*) as count FROM members WHERE tenantId = ?', [tenant.id]) as any[];
                const memberCount = parseInt(memberCountResult?.count || '0', 10);

                const [[assetsResult]] = await query('SELECT SUM(balance) as total FROM accounts WHERE tenantId = ?', [tenant.id]) as any[];

                const totalAssets = parseFloat(assetsResult?.total || '0');

                return {
                    name: tenant.name,
                    registrationNumber: tenant.registrationNumber,
                    status: tenant.status,
                    address: tenant.address || 'N/A',
                    contactEmail: tenant.contactEmail || 'N/A',
                    contactPhone: tenant.contactPhone || 'N/A',
                    memberCount,
                    totalAssets: totalAssets.toFixed(2),
                    registeredDate: tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'
                };
            })
        );

        // Generate CSV
        const headers = [
            'SACCO Name',
            'Registration Number',
            'Status',
            'Address',
            'Contact Email',
            'Contact Phone',
            'Members',
            'Total Assets (P)',
            'Registered Date'
        ];

        const csvRows = [
            headers.join(','),
            ...enrichedData.map(row =>
                [
                    `"${row.name}"`,
                    row.registrationNumber,
                    row.status,
                    `"${row.address}"`,
                    row.contactEmail,
                    row.contactPhone,
                    row.memberCount,
                    row.totalAssets,
                    row.registeredDate
                ].join(',')
            )
        ];

        const csv = csvRows.join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="sacco-directory-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error: any) {
        console.error('Error exporting directory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
