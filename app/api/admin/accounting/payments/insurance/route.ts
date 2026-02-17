import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { getUserFromRequest } from '@/lib/auth-server';
import { AccountingService } from '@/src/services/AccountingService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });
        }

        const body = await request.json();
        const { policyId, amount, description } = body;

        if (!policyId || !amount) {
            return NextResponse.json({ error: 'Missing policyId or amount' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const accountingService = new AccountingService();
        const entries = await accountingService.processInsurancePayout(user.tenantId, policyId, amount, description);

        return NextResponse.json(entries);
    } catch (error: any) {
        console.error('Error processing insurance payout:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
