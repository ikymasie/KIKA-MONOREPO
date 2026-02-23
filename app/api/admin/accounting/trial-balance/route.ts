import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getTrialBalance } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID missing' }, { status: 400 });

        const trialBalance = await getTrialBalance(user.tenantId);
        return NextResponse.json(trialBalance);
    } catch (error: any) {
        console.error('Error fetching trial balance:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
