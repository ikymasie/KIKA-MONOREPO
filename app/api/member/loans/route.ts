import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne } from '@/src/db/query';
import { getLoansByMember } from '@/src/db/services/LoanService';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const member = await queryOne<RowDataPacket>('SELECT id, tenantId FROM members WHERE userId = ? LIMIT 1', [user.id]);
        if (!member) return NextResponse.json({ error: 'Member record not found' }, { status: 404 });

        const loans = await getLoansByMember(member.id, member.tenantId);
        return NextResponse.json(loans);
    } catch (error: any) {
        console.error('Member loans API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch loans' }, { status: 500 });
    }
}
