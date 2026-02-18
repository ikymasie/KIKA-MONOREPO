import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { RegulatoryBroadcast } = await import('@/src/entities/RegulatoryBroadcast');
        const { UserRole } = await import('@/src/entities/User');


        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isRegulator() && user.role !== UserRole.SACCOS_ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const dataSource = await getDb();
        const broadcastRepo = dataSource.getRepository(RegulatoryBroadcast);

        const broadcast = await broadcastRepo.findOne({
            where: { id: params.id },
            relations: ['creator'],
        });

        if (!broadcast) {
            return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
        }

        return NextResponse.json(broadcast);
    } catch (error: any) {
        console.error('Error fetching broadcast:', error);
        return NextResponse.json(
            { error: 'Failed to fetch broadcast', details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');
        const { RegulatoryBroadcast } = await import('@/src/entities/RegulatoryBroadcast');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();

        const dataSource = await getDb();
        const broadcastRepo = dataSource.getRepository(RegulatoryBroadcast);

        const broadcast = await broadcastRepo.findOne({ where: { id: params.id } });

        if (!broadcast) {
            return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
        }

        if (broadcast.publishedAt) {
            return NextResponse.json(
                { error: 'Cannot update published broadcast' },
                { status: 400 }
            );
        }

        Object.assign(broadcast, body);
        await broadcastRepo.save(broadcast);

        return NextResponse.json(broadcast);
    } catch (error: any) {
        console.error('Error updating broadcast:', error);
        return NextResponse.json(
            { error: 'Failed to update broadcast', details: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { UserRole } = await import('@/src/entities/User');
        const { RegulatoryBroadcast } = await import('@/src/entities/RegulatoryBroadcast');
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const dataSource = await getDb();
        const broadcastRepo = dataSource.getRepository(RegulatoryBroadcast);

        const broadcast = await broadcastRepo.findOne({ where: { id: params.id } });

        if (!broadcast) {
            return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 });
        }

        if (broadcast.publishedAt) {
            return NextResponse.json(
                { error: 'Cannot delete published broadcast' },
                { status: 400 }
            );
        }

        await broadcastRepo.remove(broadcast);

        return NextResponse.json({ message: 'Broadcast deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting broadcast:', error);
        return NextResponse.json(
            { error: 'Failed to delete broadcast', details: error.message },
            { status: 500 }
        );
    }
}
