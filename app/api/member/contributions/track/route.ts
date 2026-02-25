import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/src/db/query';
import { TransactionType } from '@/src/entities/Transaction';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const member = await queryOne<any>(
            'SELECT id FROM members WHERE userId = ?',
            [user.id]
        );

        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const contributions = await query<any>(
            `SELECT * FROM transactions 
             WHERE memberId = ? AND transactionType = ?
             ORDER BY transactionDate DESC
             LIMIT 24`,
            [member.id, TransactionType.DEDUCTION]
        );

        return NextResponse.json(contributions);
    } catch (error: any) {
        console.error('Error tracking contributions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
