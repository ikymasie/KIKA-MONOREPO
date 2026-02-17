import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Tenant } from '@/src/entities/Tenant';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ isMaintenanceMode: false }); // Or true depending on desired default for unauth
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenant = await AppDataSource.getRepository(Tenant).findOne({
            where: { id: user.tenantId },
            select: ['isMaintenanceMode']
        });

        return NextResponse.json({
            isMaintenanceMode: tenant?.isMaintenanceMode || false
        });
    } catch (error) {
        console.error('Maintenance status check error:', error);
        return NextResponse.json({ isMaintenanceMode: false });
    }
}
