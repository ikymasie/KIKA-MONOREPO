import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: { tenantId: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AuditorService } = await import('@/src/services/AuditorService');
        const { AccountingService } = await import('@/src/services/AccountingService');
        const { UserRole } = await import('@/src/entities/User');


        const user = await getUserFromRequest(request);
        const { tenantId } = params;

        if (!user || user.role !== UserRole.EXTERNAL_AUDITOR) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) await AppDataSource.initialize();

        const auditorService = new AuditorService();
        const hasAccess = await auditorService.hasActiveAccess(user.id, tenantId);

        if (!hasAccess) {
            return NextResponse.json({ error: 'No active access for this tenant' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId') || undefined;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const startDate = startDateParam ? new Date(startDateParam) : undefined;
        const endDate = endDateParam ? new Date(endDateParam) : undefined;

        const accountingService = new AccountingService();
        const entries = await accountingService.getGeneralLedger(tenantId, {
            accountId,
            startDate,
            endDate
        });

        return NextResponse.json(entries);
    } catch (error: any) {
        console.error('Error fetching auditor transactions:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
