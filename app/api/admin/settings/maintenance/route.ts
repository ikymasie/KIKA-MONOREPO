import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { execute } = await import("@/src/db/query");
        const { getUserFromRequest } = await import("@/lib/auth-server");


        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { enabled } = body;

        if (typeof enabled !== 'boolean') {
            return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 400 });
        }

        await execute('UPDATE tenants SET isMaintenanceMode = ? WHERE id = ?', [enabled ? 1 : 0, user.tenantId]);

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
