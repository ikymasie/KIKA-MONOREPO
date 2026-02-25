import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("../../../../../../lib/auth-server");
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || !currentUser.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { status } = await request.json();

        if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // Prevent deactivating self
        if (params.id === currentUser.id && status === 'inactive') {
            return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
        }

        const users = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [params.id]) as any[];
        const user = users[0];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        await execute('UPDATE users SET status = ?, updatedAt = NOW() WHERE id = ?', [status, params.id]);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                status: status
            }
        });

    } catch (error: any) {
        console.error('Error updating user status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
