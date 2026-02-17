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

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'balance-sheet' | 'income-statement';

        if (!type || !['balance-sheet', 'income-statement'].includes(type)) {
            return NextResponse.json({ error: 'Invalid statement type' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const accountingService = new AccountingService();
        const data = await accountingService.getFinancialStatement(user.tenantId, type);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching financial statement:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
