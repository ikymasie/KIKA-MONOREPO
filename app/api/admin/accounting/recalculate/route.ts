import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { recalculateAccountBalances } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        await recalculateAccountBalances(user.tenantId);

        return NextResponse.json({ success: true, message: 'Account balances recalculated successfully' });
    } catch (error: any) {
        console.error('Error recalculating accounting balances:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
