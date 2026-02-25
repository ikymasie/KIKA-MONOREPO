import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { BylawStatus } from '@/src/entities/Bylaw';
import { UserRole } from '@/src/entities/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const tenantId = searchParams.get('tenantId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let sql = 'SELECT b.*, t.name as tenantName FROM bylaws b LEFT JOIN tenants t ON b.tenantId = t.id WHERE 1=1';
        const params: any[] = [];

        if (status) { sql += ' AND b.status = ?'; params.push(status); }
        if (tenantId) { sql += ' AND b.tenantId = ?'; params.push(tenantId); }

        const countResult = await queryOne<any>('SELECT COUNT(*) as total FROM bylaws WHERE 1=1' + (status ? ' AND status = ?' : '') + (tenantId ? ' AND tenantId = ?' : ''), params);
        const bylaws = await query<any>(sql + ' ORDER BY b.submittedDate DESC LIMIT ? OFFSET ?', [...params, limit, offset]);

        return NextResponse.json({ bylaws, pagination: { page, limit, total: Number(countResult?.total || 0), totalPages: Math.ceil(Number(countResult?.total || 0) / limit) } });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch bylaws', details: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.SACCOS_ADMIN && user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { tenantId, version, documentUrl, content } = body;

        if (!tenantId || !version) return NextResponse.json({ error: 'Missing required fields: tenantId, version' }, { status: 400 });
        if (user.role === UserRole.SACCOS_ADMIN && user.tenantId !== tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const id = uuidv4();
        await execute(
            'INSERT INTO bylaws (id, tenantId, version, documentUrl, content, submittedDate, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), ?, NOW(), NOW())',
            [id, tenantId, version, documentUrl || null, content || null, BylawStatus.PENDING]
        );

        return NextResponse.json(await queryOne<any>('SELECT * FROM bylaws WHERE id = ?', [id]), { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to create bylaw', details: error.message }, { status: 500 });
    }
}
