import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Tenant, TenantStatus } from '@/src/entities/Tenant';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const db = await getDb();
        if (!db) {
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        const tenantRepo = db.getRepository(Tenant);

        const tenant = await tenantRepo.findOne({
            where: {
                id: params.id,
                status: TenantStatus.ACTIVE
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
                'brandingSettings',
                'createdAt',
                'currentComplianceScore',
                'complianceRating'
            ]
        });

        if (!tenant) {
            return NextResponse.json(
                { error: 'Tenant not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: tenant });

    } catch (error) {
        console.error('Error fetching tenant details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tenant details' },
            { status: 500 }
        );
    }
}
