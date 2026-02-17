import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { getUserFromRequest } from '@/lib/auth-server';
import { AccountingService } from '@/src/services/AccountingService';

export async function GET(request: NextRequest) {
    try {
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
