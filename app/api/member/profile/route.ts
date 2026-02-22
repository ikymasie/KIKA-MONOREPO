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

export async function PATCH(request: NextRequest) {
    try {
        const { AppDataSource } = await import('@/src/config/database');
        const { Member } = await import('@/src/entities/Member');
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const memberRepo = AppDataSource.getRepository(Member);
        const member = await memberRepo.findOne({ where: { userId: user.id } });
        if (!member) {
            return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
        }

        const body = await request.json();
        // Only allow the fields a member is permitted to self-update
        const allowedFields: string[] = ['phone', 'physicalAddress', 'employer', 'employmentStatus'];
        let updated = false;
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                (member as any)[field] = body[field];
                updated = true;
            }
        }

        if (!updated) {
            return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
        }

        await memberRepo.save(member);
        return NextResponse.json({ message: 'Profile updated successfully', member });
    } catch (error: any) {
        console.error('Member profile PATCH error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 });
    }
}
