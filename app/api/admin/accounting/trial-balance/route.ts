import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AccountingService } = await import('@/src/services/AccountingService');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'Tenant ID missing' }, { status: 400 });
        }

        const accountingService = new AccountingService();
        const trialBalance = await accountingService.getTrialBalance(user.tenantId);

        return NextResponse.json(trialBalance);
    } catch (error: any) {
        console.error('Error fetching trial balance:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
