import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import("@/src/db/query");
        const { getUserFromRequest } = await import("@/lib/auth-server");


        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [member] = await query('SELECT id FROM members WHERE userId = ? LIMIT 1', [user.id]) as any;
        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const transactions = await query('SELECT * FROM transactions WHERE memberId = ? ORDER BY createdAt DESC LIMIT 50', [member.id]);

        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
