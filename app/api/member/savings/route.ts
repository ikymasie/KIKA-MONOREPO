import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne } from '@/src/db/query';
import { getMemberSavings, getMemberTotalSavings } from '@/src/db/services/SavingsService';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const member = await queryOne<RowDataPacket>('SELECT id FROM members WHERE userId = ? LIMIT 1', [user.id]);
        if (!member) return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });

        const savings = await getMemberSavings(member.id);
        return NextResponse.json(savings);
    } catch (error: any) {
        console.error('Error fetching member savings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
