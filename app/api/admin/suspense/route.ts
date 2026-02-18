import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// List all suspense account entries
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SuspenseAccount, SuspenseStatus } = await import('@/src/entities/SuspenseAccount');


        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as any;

        const db = await getDb();
        const suspenseRepo = db.getRepository(SuspenseAccount);

        const where: any = { tenantId: user.tenantId };
        if (status) {
            where.status = status;
        }

        const entries = await suspenseRepo.find({
            where,
            relations: ['allocatedToMember'],
            order: { createdAt: 'DESC' },
        });

        // Calculate days in suspense
        const now = new Date();
        const enrichedEntries = entries.map(entry => ({
            ...entry,
            daysInSuspense: Math.floor((now.getTime() - entry.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        }));

        return NextResponse.json({ entries: enrichedEntries });
    } catch (error: any) {
        console.error('Error fetching suspense accounts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Allocate suspense entry to a member
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { SuspenseAccount, SuspenseStatus } = await import('@/src/entities/SuspenseAccount');
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { suspenseId, memberId, notes } = await request.json();

        if (!suspenseId || !memberId) {
            return NextResponse.json(
                { error: 'Suspense ID and Member ID are required' },
                { status: 400 }
            );
        }

        const db = await getDb();
        const suspenseRepo = db.getRepository(SuspenseAccount);

        const entry = await suspenseRepo.findOne({
            where: { id: suspenseId, tenantId: user.tenantId },
        });

        if (!entry) {
            return NextResponse.json({ error: 'Suspense entry not found' }, { status: 404 });
        }

        if (entry.status !== SuspenseStatus.PENDING) {
            return NextResponse.json({ error: 'Suspense entry already processed' }, { status: 400 });
        }

        await suspenseRepo.update(suspenseId, {
            status: SuspenseStatus.ALLOCATED,
            allocatedToMemberId: memberId,
            allocatedBy: user.id,
            allocatedAt: new Date(),
            notes,
        });

        return NextResponse.json({
            success: true,
            message: 'Suspense entry allocated successfully',
        });
    } catch (error: any) {
        console.error('Error allocating suspense entry:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
