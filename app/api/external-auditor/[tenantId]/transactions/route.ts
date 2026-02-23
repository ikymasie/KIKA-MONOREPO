import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { AuditorService } from '@/src/services/AuditorService';
import { getGeneralLedger } from '@/src/db/services/AccountingService';

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

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId') || undefined;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const startDate = startDateParam ? new Date(startDateParam).toISOString() : undefined;
        const endDate = endDateParam ? new Date(endDateParam).toISOString() : undefined;

        const entries = await getGeneralLedger(
            tenantId,
            startDate,
            endDate,
            accountId
        );

        return NextResponse.json(entries);
    } catch (error: any) {
        console.error('Error fetching auditor transactions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
