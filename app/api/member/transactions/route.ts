import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Transaction } = await import('@/src/entities/Transaction');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // Find the member record for this user
        const memberRepo = AppDataSource.getRepository('Member');
        const member = await memberRepo.findOne({
            where: { firebaseUid: user.firebaseUid }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const transactionRepo = AppDataSource.getRepository(Transaction);
        const transactions = await transactionRepo.find({
            where: { memberId: member.id },
            order: { createdAt: 'DESC' },
            take: 50 // Limit to last 50 transactions for now
        });

        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
