import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { Transaction, TransactionType } = await import('@/src/entities/Transaction');
        const { Member } = await import('@/src/entities/Member');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const memberRepo = db.getRepository(Member);
        const transactionRepo = db.getRepository(Transaction);

        const member = await memberRepo.findOne({
            where: { userId: user.id }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member profile not found' }, { status: 404 });
        }

        const contributions = await transactionRepo.find({
            where: {
                memberId: member.id,
                transactionType: TransactionType.DEDUCTION
            },
            order: { transactionDate: 'DESC' },
            take: 24
        });

        return NextResponse.json(contributions);
    } catch (error: any) {
        console.error('Error tracking contributions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
