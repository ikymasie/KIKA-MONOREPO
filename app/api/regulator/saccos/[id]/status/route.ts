import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const tenants = await query('SELECT * FROM tenants WHERE id = ?', [params.id]) as any[];
        const tenant = tenants[0];

        if (!tenant) {
            return NextResponse.json({ error: 'SACCO not found' }, { status: 404 });
        }

        const previousStatus = tenant.status;

        await execute('UPDATE tenants SET status = ?, updatedAt = NOW() WHERE id = ?', [status, params.id]);

        // TODO: Log this action in an audit trail
        // TODO: Send notification to SACCO administrators

        return NextResponse.json({
            success: true,
            message: `SACCO ${status === 'active' ? 'activated' : 'suspended'} successfully`,
            tenant: {
                id: tenant.id,
                name: tenant.name,
                status: status,
                previousStatus
            }
        });

    } catch (error: any) {
        console.error('Error updating SACCO status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
