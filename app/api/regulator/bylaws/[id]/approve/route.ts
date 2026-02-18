import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { Bylaw, BylawStatus } = await import('@/src/entities/Bylaw');
        const { UserRole } = await import('@/src/entities/User');

    
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { effectiveDate, notes } = body;

        const dataSource = await getDb();
        const bylawRepo = dataSource.getRepository(Bylaw);

        const bylaw = await bylawRepo.findOne({
            where: { id: params.id },
            relations: ['tenant'],
        });

        if (!bylaw) {
            return NextResponse.json({ error: 'Bylaw not found' }, { status: 404 });
        }

        if (bylaw.status !== BylawStatus.PENDING) {
            return NextResponse.json(
                { error: 'Bylaw has already been processed' },
                { status: 400 }
            );
        }

        bylaw.status = BylawStatus.APPROVED;
        bylaw.approvedBy = user.id;
        bylaw.approvedDate = new Date();
        bylaw.effectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();
        bylaw.notes = notes;

        await bylawRepo.save(bylaw);

        // TODO: Send notification to tenant admins via notification system
        // Notification details: Bye-laws Approved
        // Priority: high
        // Channels: email, in_app

        return NextResponse.json(bylaw);
    } catch (error: any) {
        console.error('Error approving bylaw:', error);
        return NextResponse.json(
            { error: 'Failed to approve bylaw', details: error.message },
            { status: 500 }
        );
    }
}
