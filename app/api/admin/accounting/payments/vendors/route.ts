import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
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

        const body = await request.json();
        const { vendorId, amount, description } = body;

        if (!vendorId || !amount) {
            return NextResponse.json({ error: 'Missing vendorId or amount' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const accountingService = new AccountingService();
        const entries = await accountingService.processVendorPayment(user.tenantId, vendorId, amount, description);

        return NextResponse.json(entries);
    } catch (error: any) {
        console.error('Error processing vendor payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
