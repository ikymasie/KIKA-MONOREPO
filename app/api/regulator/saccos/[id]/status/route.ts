import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { Tenant } from '@/entities/Tenant';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

        const { status, reason } = await request.json();

        if (!['active', 'suspended', 'inactive'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const tenantRepo = AppDataSource.getRepository(Tenant);
        const tenant = await tenantRepo.findOne({ where: { id: params.id } });

        if (!tenant) {
            return NextResponse.json({ error: 'SACCO not found' }, { status: 404 });
        }

        const previousStatus = tenant.status;
        tenant.status = status;

        await tenantRepo.save(tenant);

        // TODO: Log this action in an audit trail
        // TODO: Send notification to SACCO administrators

        return NextResponse.json({
            success: true,
            message: `SACCO ${status === 'active' ? 'activated' : 'suspended'} successfully`,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                status: tenant.status,
                previousStatus
            }
        });

    } catch (error: any) {
        console.error('Error updating SACCO status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
