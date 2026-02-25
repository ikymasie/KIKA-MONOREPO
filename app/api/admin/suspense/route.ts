import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { SuspenseStatus } from '@/src/entities/SuspenseAccount';

export const dynamic = 'force-dynamic';

// List all suspense account entries
export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let sql = `
            SELECT sa.*, m.fullName as allocatedToMemberName 
            FROM suspense_accounts sa
            LEFT JOIN members m ON sa.allocatedToMemberId = m.id
            WHERE sa.tenantId = ?
        `;
        const params: any[] = [user.tenantId];

        if (status) {
            sql += ' AND sa.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY sa.createdAt DESC';

        const entries = await query<any>(sql, params);

        const now = new Date();
        const enrichedEntries = entries.map((entry: any) => ({
            ...entry,
            daysInSuspense: Math.floor((now.getTime() - new Date(entry.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        }));

        return NextResponse.json({ entries: enrichedEntries });
    } catch (error: any) {
        console.error('Error fetching suspense accounts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Allocate suspense entry to a member
export async function POST(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { queryOne } = await import('@/src/db/query');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { suspenseId, memberId, notes } = await request.json();

        if (!suspenseId || !memberId) {
            return NextResponse.json({ error: 'Suspense ID and Member ID are required' }, { status: 400 });
        }

        const entry = await queryOne<any>(
            'SELECT * FROM suspense_accounts WHERE id = ? AND tenantId = ?',
            [suspenseId, user.tenantId]
        );

        if (!entry) return NextResponse.json({ error: 'Suspense entry not found' }, { status: 404 });
        if (entry.status !== SuspenseStatus.PENDING) {
            return NextResponse.json({ error: 'Suspense entry already processed' }, { status: 400 });
        }

        await execute(
            'UPDATE suspense_accounts SET status = ?, allocatedToMemberId = ?, allocatedBy = ?, allocatedAt = NOW(), notes = ? WHERE id = ?',
            [SuspenseStatus.ALLOCATED, memberId, user.id, notes || null, suspenseId]
        );

        return NextResponse.json({ success: true, message: 'Suspense entry allocated successfully' });
    } catch (error: any) {
        console.error('Error allocating suspense entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
