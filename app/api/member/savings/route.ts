import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { MemberSavings } from '@/src/entities/MemberSavings';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
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

        const savingsRepo = AppDataSource.getRepository(MemberSavings);
        const savings = await savingsRepo.find({
            where: { memberId: member.id },
            relations: ['product'],
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(savings);
    } catch (error: any) {
        console.error('Error fetching member savings:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
