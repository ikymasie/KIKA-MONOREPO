import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Tenant } from '@/src/entities/Tenant';
import { Member } from '@/src/entities/Member';
import { Account } from '@/src/entities/Account';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';
        const status = searchParams.get('status');

        const tenantRepo = AppDataSource.getRepository(Tenant);

        let queryBuilder = tenantRepo.createQueryBuilder('tenant')
            .leftJoinAndSelect('tenant.users', 'users') // To get contact info if needed, or better separate query
            .select(['tenant.id', 'tenant.name', 'tenant.status', 'tenant.createdAt', 'tenant.registrationNumber']); // Select specific fields

        if (query) {
            queryBuilder = queryBuilder.where('tenant.name LIKE :query OR tenant.registrationNumber LIKE :query', { query: `%${query}%` });
        }

        if (status) {
            queryBuilder = queryBuilder.andWhere('tenant.status = :status', { status });
        }

        const tenants = await queryBuilder.getMany();

        // Enrich with stats (Member count, Assets)
        // This could be optimized with subqueries, but for now loop is acceptable for reasonable N or paginate
        const directoryData = await Promise.all(tenants.map(async (tenant) => {
            const memberCount = await AppDataSource.getRepository(Member).count({ where: { tenantId: tenant.id } });

            // Total Assets = Sum of Savings Accounts (simplification)
            const assetsResult = await AppDataSource.getRepository(Account)
                .createQueryBuilder('account')
                .select('SUM(account.balance)', 'total')
                .where('account.tenantId = :tenantId', { tenantId: tenant.id })
                .getRawOne();
            const totalAssets = parseFloat(assetsResult?.total || '0');

            return {
                id: tenant.id,
                name: tenant.name,
                registrationNumber: tenant.registrationNumber || 'N/A',
                status: tenant.status,
                memberCount,
                totalAssets,
                joinedDate: tenant.createdAt
            };
        }));

        return NextResponse.json(directoryData);

    } catch (error: any) {
        console.error('Error fetching directory:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
