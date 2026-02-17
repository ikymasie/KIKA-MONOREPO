import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Transaction, TransactionType } from '@/src/entities/Transaction';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
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
