import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/src/db/query';
import { UserRole } from '@/src/entities/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR && user.role !== UserRole.SACCOS_ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const bylaw = await queryOne<any>('SELECT b.*, t.name as tenantName FROM bylaws b LEFT JOIN tenants t ON b.tenantId = t.id WHERE b.id = ?', [params.id]);
        if (!bylaw) return NextResponse.json({ error: 'Bylaw not found' }, { status: 404 });
        if (user.role === UserRole.SACCOS_ADMIN && bylaw.tenantId !== user.tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        return NextResponse.json(bylaw);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch bylaw', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.SACCOS_ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const { version, documentUrl, content } = body;

        const bylaw = await queryOne<any>('SELECT * FROM bylaws WHERE id = ?', [params.id]);
        if (!bylaw) return NextResponse.json({ error: 'Bylaw not found' }, { status: 404 });
        if (bylaw.tenantId !== user.tenantId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        if (bylaw.status !== 'pending') return NextResponse.json({ error: 'Can only update pending bylaws' }, { status: 400 });

        const updates: string[] = ['updatedAt = NOW()'];
        const values: any[] = [];
        if (version) { updates.push('version = ?'); values.push(version); }
        if (documentUrl) { updates.push('documentUrl = ?'); values.push(documentUrl); }
        if (content) { updates.push('content = ?'); values.push(content); }

        await execute(`UPDATE bylaws SET ${updates.join(', ')} WHERE id = ?`, [...values, params.id]);

        return NextResponse.json(await queryOne<any>('SELECT * FROM bylaws WHERE id = ?', [params.id]));
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update bylaw', details: error.message }, { status: 500 });
    }
}
