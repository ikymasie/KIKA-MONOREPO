import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Tenant, TenantStatus } from '@/src/entities/Tenant';
import { Like } from 'typeorm';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const offset = (page - 1) * limit;

        const db = await getDb();
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const tenantRepo = db.getRepository(Tenant);

        // Build where clause
        const where: any = {
            status: TenantStatus.ACTIVE
        };

        if (query) {
            where.name = Like(`%${query}%`);
        }

        const [tenants, total] = await tenantRepo.findAndCount({
            where,
            take: limit,
            skip: offset,
            order: {
                name: 'ASC'
            },
            select: [
                'id',
                'name',
                'code',
                'registrationNumber',
                'registrationDate',
                'address',
                'phone',
                'email',
                'logoUrl',
                'primaryColor',
                'secondaryColor',
                'createdAt'
            ]
        });

        return NextResponse.json({
            data: tenants,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching directory:', error);
        return NextResponse.json(
            { error: 'Failed to fetch directory listing' },
            { status: 500 }
        );
    }
}
