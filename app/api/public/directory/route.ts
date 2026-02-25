import { NextRequest, NextResponse } from 'next/server';
import { query as dbQuery, queryOne, execute } from '@/src/db/query';
import { TenantStatus } from '@/src/entities/Tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        let sql = `SELECT id, name, code, registrationNumber, registrationDate, address, phone, email,
                          logoUrl, primaryColor, secondaryColor, createdAt
                   FROM tenants WHERE status = ?`;
        const params: any[] = [TenantStatus.ACTIVE];

        if (searchQuery) {
            sql += ' AND name LIKE ?';
            params.push(`%${searchQuery}%`);
        }

        const countSql = sql.replace(
            /SELECT .* FROM/, 'SELECT COUNT(*) as total FROM'
        );

        const [tenants, countResult] = await Promise.all([
            dbQuery<any>(sql + ' ORDER BY name ASC LIMIT ? OFFSET ?', [...params, limit, offset]),
            queryOne<any>(countSql, params),
        ]);

        const total = Number(countResult?.total || 0);

        return NextResponse.json({
            data: tenants,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Error fetching directory:', error);
        return NextResponse.json({ error: 'Failed to fetch directory listing' }, { status: 500 });
    }
}
