import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { getUserFromRequest } from '@/lib/auth-server';
import { AccountingService } from '@/src/services/AccountingService';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
