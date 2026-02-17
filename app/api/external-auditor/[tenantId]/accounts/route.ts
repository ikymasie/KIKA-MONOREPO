import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { getUserFromRequest } from '@/lib/auth-server';
import { AuditorService } from '@/src/services/AuditorService';
import { AccountingService } from '@/src/services/AccountingService';
import { UserRole } from '@/src/entities/User';
import { AccountStatus } from '@/src/entities/Account';

export async function GET(
    request: NextRequest,
    { params }: { params: { tenantId: string } }
) {
    try {
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
