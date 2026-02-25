import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/src/db/query';
import { TenantStatus } from '@/src/entities/Tenant';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const tenant = await queryOne<any>(
            `SELECT id, name, code, registrationNumber, registrationDate, address, phone, email,
                    logoUrl, primaryColor, secondaryColor, brandingSettings, createdAt,
                    currentComplianceScore, complianceRating
             FROM tenants WHERE id = ? AND status = ?`,
            [params.id, TenantStatus.ACTIVE]
        );

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        return NextResponse.json({ data: tenant });

    } catch (error) {
        console.error('Error fetching tenant details:', error);
        return NextResponse.json({ error: 'Failed to fetch tenant details' }, { status: 500 });
    }
}
