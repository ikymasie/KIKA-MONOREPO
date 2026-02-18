import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { MemberSavings } = await import('@/src/entities/MemberSavings');
        const { Member } = await import('@/src/entities/Member');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { accountId, newAmount } = body;

        if (!accountId || typeof newAmount !== 'number') {
            return NextResponse.json({ error: 'Account ID and valid new amount are required' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Find the member record for this user
        const memberRepo = AppDataSource.getRepository(Member);
        const member = await memberRepo.findOne({
            where: { userId: user.id }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const savingsRepo = AppDataSource.getRepository(MemberSavings);
        const account = await savingsRepo.findOne({
            where: { id: accountId, memberId: member.id }
        });

        if (!account) {
            return NextResponse.json({ error: 'Savings account not found or access denied' }, { status: 404 });
        }

        // Update the contribution
        account.monthlyContribution = newAmount;
        await savingsRepo.save(account);

        return NextResponse.json({
            message: 'Contribution updated successfully',
            newAmount: account.monthlyContribution
        });
    } catch (error: any) {
        console.error('Error updating contribution:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
