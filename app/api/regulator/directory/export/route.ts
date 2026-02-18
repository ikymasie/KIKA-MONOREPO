import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { Tenant } from '@/entities/Tenant';
import { Member } from '@/entities/Member';
import { Account } from '@/entities/Account';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || '';

        // Build query
        let query = AppDataSource.getRepository(Tenant)
            .createQueryBuilder('tenant')
            .leftJoinAndSelect('tenant.users', 'user')
            .select([
                'tenant.id',
                'tenant.name',
                'tenant.registrationNumber',
                'tenant.status',
                'tenant.address',
                'tenant.createdAt',
                'user.email',
                'user.phone'
            ]);

        if (search) {
            query = query.where(
                'tenant.name ILIKE :search OR tenant.registrationNumber ILIKE :search',
                { search: `%${search}%` }
            );
        }

        if (status) {
            query = query.andWhere('tenant.status = :status', { status });
        }

        const tenants = await query.getMany();

        // Get member counts and total assets for each tenant
        const enrichedData = await Promise.all(
            tenants.map(async (tenant) => {
                const memberCount = await AppDataSource.getRepository(Member).count({
                    where: { tenantId: tenant.id }
                });

                const assetsResult = await AppDataSource.getRepository(Account)
                    .createQueryBuilder('account')
                    .select('SUM(account.balance)', 'total')
                    .where('account.tenantId = :tenantId', { tenantId: tenant.id })
                    .getRawOne();

                const totalAssets = parseFloat(assetsResult?.total || '0');

                return {
                    name: tenant.name,
                    registrationNumber: tenant.registrationNumber,
                    status: tenant.status,
                    address: tenant.address || 'N/A',
                    contactEmail: tenant.users?.[0]?.email || 'N/A',
                    contactPhone: tenant.users?.[0]?.phone || 'N/A',
                    memberCount,
                    totalAssets: totalAssets.toFixed(2),
                    registeredDate: new Date(tenant.createdAt).toLocaleDateString()
                };
            })
        );

        // Generate CSV
        const headers = [
            'SACCO Name',
            'Registration Number',
            'Status',
            'Address',
            'Contact Email',
            'Contact Phone',
            'Members',
            'Total Assets (P)',
            'Registered Date'
        ];

        const csvRows = [
            headers.join(','),
            ...enrichedData.map(row =>
                [
                    `"${row.name}"`,
                    row.registrationNumber,
                    row.status,
                    `"${row.address}"`,
                    row.contactEmail,
                    row.contactPhone,
                    row.memberCount,
                    row.totalAssets,
                    row.registeredDate
                ].join(',')
            )
        ];

        const csv = csvRows.join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="sacco-directory-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error: any) {
        console.error('Error exporting directory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
