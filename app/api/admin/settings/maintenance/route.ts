import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Tenant } from '@/src/entities/Tenant';
import { getUserFromRequest } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenantRepo = AppDataSource.getRepository(Tenant);
        await tenantRepo.update(user.tenantId, { isMaintenanceMode: enabled });

        return NextResponse.json({
            success: true,
            isMaintenanceMode: enabled,
            message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`
        });
    } catch (error: any) {
        console.error('Maintenance toggle error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
