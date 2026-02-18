import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
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
        const { AccountStatus } = await import('@/src/entities/Account');


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

        // Use AccountingService to fetch accounts for the tenant
        const accountRepo = AppDataSource.getRepository('Account');
        const accounts = await accountRepo.find({
            where: { tenantId, status: AccountStatus.ACTIVE },
            order: { code: 'ASC' },
        });

        return NextResponse.json(accounts);
    } catch (error: any) {
        console.error('Error fetching auditor accounts:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
