import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/src/db/query';
import { UserRole } from '@/src/entities/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isRegulator() && user.role !== UserRole.SACCOS_ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const broadcast = await queryOne<any>('SELECT * FROM regulatory_broadcasts WHERE id = ?', [params.id]);
        if (!broadcast) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });

        return NextResponse.json(broadcast);
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch broadcast', details: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await request.json();
        const broadcast = await queryOne<any>('SELECT * FROM regulatory_broadcasts WHERE id = ?', [params.id]);
        if (!broadcast) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
        if (broadcast.publishedAt) return NextResponse.json({ error: 'Cannot update published broadcast' }, { status: 400 });

        const updates: string[] = [];
        const values: any[] = [];
        for (const [key, value] of Object.entries(body)) {
            updates.push(`${key} = ?`);
            values.push(typeof value === 'object' ? JSON.stringify(value) : value);
        }
        updates.push('updatedAt = NOW()');

        await execute(`UPDATE regulatory_broadcasts SET ${updates.join(', ')} WHERE id = ?`, [...values, params.id]);

        return NextResponse.json(await queryOne<any>('SELECT * FROM regulatory_broadcasts WHERE id = ?', [params.id]));
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update broadcast', details: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== UserRole.DCD_DIRECTOR) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const broadcast = await queryOne<any>('SELECT * FROM regulatory_broadcasts WHERE id = ?', [params.id]);
        if (!broadcast) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
        if (broadcast.publishedAt) return NextResponse.json({ error: 'Cannot delete published broadcast' }, { status: 400 });

        await execute('DELETE FROM regulatory_broadcasts WHERE id = ?', [params.id]);
        return NextResponse.json({ message: 'Broadcast deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete broadcast', details: error.message }, { status: 500 });
    }
}
