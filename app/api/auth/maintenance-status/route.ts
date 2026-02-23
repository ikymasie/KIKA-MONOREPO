import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import('@/src/db/query');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ isMaintenanceMode: false }); // Or true depending on desired default for unauth
        }

        const [[tenant]] = await query(
            'SELECT isMaintenanceMode FROM tenants WHERE id = ? LIMIT 1',
            [user.tenantId]
        ) as any;

        return NextResponse.json({
            isMaintenanceMode: tenant?.isMaintenanceMode || false
        });
    } catch (error) {
        console.error('Maintenance status check error:', error);
        return NextResponse.json({ isMaintenanceMode: false });
    }
}
