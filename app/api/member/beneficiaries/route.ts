import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne, query, execute, buildSetClause } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';

async function getMemberId(userId: string): Promise<string | null> {
    const row = await queryOne<RowDataPacket>('SELECT id FROM members WHERE userId = ? LIMIT 1', [userId]);
    return row?.id ?? null;
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const memberId = await getMemberId(user.id);
        if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const beneficiaries = await query<RowDataPacket>(
            'SELECT * FROM beneficiaries WHERE memberId = ? ORDER BY firstName ASC', [memberId]
        );
        return NextResponse.json(beneficiaries);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const memberId = await getMemberId(user.id);
        if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const body = await request.json();
        const id = uuidv4();
        const cols = ['id', 'memberId', ...Object.keys(body)];
        const vals = [id, memberId, ...Object.values(body)];
        const placeholders = cols.map(() => '?').join(', ');
        await execute(
            `INSERT INTO beneficiaries (\`${cols.join('`, `')}\`, createdAt, updatedAt) VALUES (${placeholders}, NOW(), NOW())`,
            vals
        );
        const created = await queryOne<RowDataPacket>('SELECT * FROM beneficiaries WHERE id = ? LIMIT 1', [id]);
        return NextResponse.json(created);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const memberId = await getMemberId(user.id);
        if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const { id, ...updateData } = await request.json();
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const existing = await queryOne<RowDataPacket>('SELECT id FROM beneficiaries WHERE id = ? AND memberId = ? LIMIT 1', [id, memberId]);
        if (!existing) return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 });

        const { clause, values } = buildSetClause(updateData);
        await execute(`UPDATE beneficiaries SET ${clause}, updatedAt = NOW() WHERE id = ? AND memberId = ?`, [...values, id, memberId]);

        const updated = await queryOne<RowDataPacket>('SELECT * FROM beneficiaries WHERE id = ? LIMIT 1', [id]);
        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const memberId = await getMemberId(user.id);
        if (!memberId) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const result = await execute('DELETE FROM beneficiaries WHERE id = ? AND memberId = ?', [id, memberId]);
        if ((result as any).affectedRows === 0) return NextResponse.json({ error: 'Beneficiary not found' }, { status: 404 });

        return NextResponse.json({ message: 'Beneficiary deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
