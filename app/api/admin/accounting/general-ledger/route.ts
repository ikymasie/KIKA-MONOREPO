import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { getUserFromRequest } from '@/lib/auth-server';
import { AccountingService } from '@/src/services/AccountingService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });
        }

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId') || undefined;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        const startDate = startDateParam ? new Date(startDateParam) : undefined;
        const endDate = endDateParam ? new Date(endDateParam) : undefined;

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const accountingService = new AccountingService();
        const entries = await accountingService.getGeneralLedger(user.tenantId, {
            accountId,
            startDate,
            endDate
        });

        return NextResponse.json(entries);
    } catch (error: any) {
        console.error('Error fetching GL:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
