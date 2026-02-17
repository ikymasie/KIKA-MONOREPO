import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth-server';
import { Bylaw, BylawStatus } from '@/src/entities/Bylaw';
import { UserRole } from '@/src/entities/User';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only DCD_DIRECTOR can access
        if (user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as BylawStatus | null;
        const tenantId = searchParams.get('tenantId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const dataSource = await getDb();
        const bylawRepo = dataSource.getRepository(Bylaw);

        const queryBuilder = bylawRepo
            .createQueryBuilder('bylaw')
            .leftJoinAndSelect('bylaw.tenant', 'tenant')
            .leftJoinAndSelect('bylaw.approver', 'approver')
            .orderBy('bylaw.submittedDate', 'DESC');

        if (status) {
            queryBuilder.andWhere('bylaw.status = :status', { status });
        }

        if (tenantId) {
            queryBuilder.andWhere('bylaw.tenantId = :tenantId', { tenantId });
        }

        const [bylaws, total] = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return NextResponse.json({
            bylaws,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error: any) {
        console.error('Error fetching bylaws:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bylaws', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // SACCOS_ADMIN can submit bylaws
        if (user.role !== UserRole.SACCOS_ADMIN && user.role !== UserRole.DCD_DIRECTOR) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { tenantId, version, documentUrl, content } = body;

        if (!tenantId || !version) {
            return NextResponse.json(
                { error: 'Missing required fields: tenantId, version' },
                { status: 400 }
            );
        }

        // Verify user belongs to tenant (if SACCOS_ADMIN)
        if (user.role === UserRole.SACCOS_ADMIN && user.tenantId !== tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const dataSource = await getDb();
        const bylawRepo = dataSource.getRepository(Bylaw);

        const bylaw = bylawRepo.create({
            tenantId,
            version,
            documentUrl,
            content,
            submittedDate: new Date(),
            status: BylawStatus.PENDING,
        });

        await bylawRepo.save(bylaw);

        return NextResponse.json(bylaw, { status: 201 });
    } catch (error: any) {
        console.error('Error creating bylaw:', error);
        return NextResponse.json(
            { error: 'Failed to create bylaw', details: error.message },
            { status: 500 }
        );
    }
}
