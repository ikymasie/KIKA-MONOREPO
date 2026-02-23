import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getFinancialStatement } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as 'balance-sheet' | 'income-statement';
        if (!type || !['balance-sheet', 'income-statement'].includes(type)) {
            return NextResponse.json({ error: 'Invalid statement type' }, { status: 400 });
        }

        const data = await getFinancialStatement(user.tenantId, type);
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching financial statement:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
