import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne, query, execute, buildSetClause } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const member = await queryOne<RowDataPacket>(
            `SELECT m.*, t.name AS tenantName FROM members m
             LEFT JOIN tenants t ON t.id = m.tenantId
             WHERE m.userId = ? LIMIT 1`,
            [user.id]
        );
        if (!member) return NextResponse.json({ error: 'Member record not found' }, { status: 404 });

        const beneficiaries = await query<RowDataPacket>('SELECT * FROM beneficiaries WHERE memberId = ?', [member.id]);

        return NextResponse.json({ ...member, beneficiaries });
    } catch (error: any) {
        console.error('Member profile API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch profile' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const member = await queryOne<RowDataPacket>('SELECT id FROM members WHERE userId = ? LIMIT 1', [user.id]);
        if (!member) return NextResponse.json({ error: 'Member record not found' }, { status: 404 });

        const body = await request.json();
        const allowedFields = ['phone', 'physicalAddress', 'employer', 'employmentStatus'];
        const updates: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) updates[field] = body[field];
        }

        if (!Object.keys(updates).length) {
            return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
        }

        const { clause, values } = buildSetClause(updates);
        await execute(`UPDATE members SET ${clause}, updatedAt = NOW() WHERE id = ?`, [...values, member.id]);

        const updated = await queryOne<RowDataPacket>('SELECT * FROM members WHERE id = ? LIMIT 1', [member.id]);
        return NextResponse.json({ message: 'Profile updated successfully', member: updated });
    } catch (error: any) {
        console.error('Member profile PATCH error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
    }
}
