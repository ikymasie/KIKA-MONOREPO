import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query, execute } = await import("@/src/db/query");
        const { getUserFromRequest } = await import("@/lib/auth-server");


        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { accountId, newAmount } = body;

        if (!accountId || typeof newAmount !== 'number') {
            return NextResponse.json({ error: 'Account ID and valid new amount are required' }, { status: 400 });
        }

        const [member] = await query('SELECT id FROM members WHERE userId = ? LIMIT 1', [user.id]) as any;
        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const [account] = await query('SELECT id, monthlyContribution FROM member_savings WHERE id = ? AND memberId = ? LIMIT 1', [accountId, member.id]) as any;
        if (!account) {
            return NextResponse.json({ error: 'Savings account not found or access denied' }, { status: 404 });
        }

        // Update the contribution
        await execute('UPDATE member_savings SET monthlyContribution = ?, updatedAt = NOW() WHERE id = ?', [newAmount, accountId]);
        account.monthlyContribution = newAmount;

        return NextResponse.json({
            message: 'Contribution updated successfully',
            newAmount: account.monthlyContribution
        });
    } catch (error: any) {
        console.error('Error updating contribution:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
