import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { AuditorService } from '@/src/services/AuditorService';
import { query } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    { params }: { params: { tenantId: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        const { tenantId } = params;

        if (!user || user.role !== 'external_auditor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const auditorService = new AuditorService();
        const hasAccess = await auditorService.hasActiveAccess(user.id, tenantId);

        if (!hasAccess) {
            return NextResponse.json({ error: 'No active access for this tenant' }, { status: 403 });
        }

        const accounts = await query('SELECT * FROM accounts WHERE tenantId = ? AND status = ? ORDER BY code ASC', [tenantId, 'active']);

        return NextResponse.json(accounts);
    } catch (error: any) {
        console.error('Error fetching auditor accounts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
