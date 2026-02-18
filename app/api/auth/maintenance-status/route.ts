import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Tenant } = await import('@/src/entities/Tenant');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
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
