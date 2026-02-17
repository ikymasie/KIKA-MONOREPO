import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { Loan } from '@/src/entities/Loan';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);
        const loanRepo = AppDataSource.getRepository(Loan);

        const member = await memberRepo.findOne({
            where: { userId: user.id }
        });

        if (!member) {
            return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
        }

        const loans = await loanRepo.find({
            where: { memberId: member.id },
            relations: ['product'],
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(loans);
    } catch (error: any) {
        console.error('Member loans API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch loans' },
            { status: 500 }
        );
    }
}
