import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Member } = await import('@/src/entities/Member');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);
        const member = await memberRepo.findOne({
            where: { userId: user.id },
            relations: ['tenant', 'beneficiaries', 'dependents']
        });

        if (!member) {
            return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
        }

        return NextResponse.json(member);
    } catch (error: any) {
        console.error('Member profile API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch profile' },
            { status: 500 }
        );
    }
}
