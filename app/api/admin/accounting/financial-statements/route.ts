import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

        if (!user.tenantId) {
            return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });
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
