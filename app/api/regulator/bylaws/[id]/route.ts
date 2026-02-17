import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-server';
import { Bylaw } from '@/src/entities/Bylaw';
import { UserRole } from '@/src/entities/User';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.DCD_DIRECTOR && user.role !== UserRole.SACCOS_ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const dataSource = await getDb();
        const bylawRepo = dataSource.getRepository(Bylaw);

        const bylaw = await bylawRepo.findOne({
            where: { id: params.id },
            relations: ['tenant', 'approver'],
        });

        if (!bylaw) {
            return NextResponse.json({ error: 'Bylaw not found' }, { status: 404 });
        }

        // SACCOS_ADMIN can only view their own bylaws
        if (user.role === UserRole.SACCOS_ADMIN && bylaw.tenantId !== user.tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(bylaw);
    } catch (error: any) {
        console.error('Error fetching bylaw:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bylaw', details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== UserRole.SACCOS_ADMIN) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { version, documentUrl, content } = body;

        const dataSource = await getDb();
        const bylawRepo = dataSource.getRepository(Bylaw);

        const bylaw = await bylawRepo.findOne({ where: { id: params.id } });

        if (!bylaw) {
            return NextResponse.json({ error: 'Bylaw not found' }, { status: 404 });
        }

        if (bylaw.tenantId !== user.tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Can only update pending bylaws
        if (bylaw.status !== 'pending') {
            return NextResponse.json(
                { error: 'Can only update pending bylaws' },
                { status: 400 }
            );
        }

        if (version) bylaw.version = version;
        if (documentUrl) bylaw.documentUrl = documentUrl;
        if (content) bylaw.content = content;

        await bylawRepo.save(bylaw);

        return NextResponse.json(bylaw);
    } catch (error: any) {
        console.error('Error updating bylaw:', error);
        return NextResponse.json(
            { error: 'Failed to update bylaw', details: error.message },
            { status: 500 }
        );
    }
}
