import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { processInsurancePayout } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        const body = await request.json();
        const { policyId, amount, description } = body;

        if (!policyId || !amount) {
            return NextResponse.json({ error: 'Missing policyId or amount' }, { status: 400 });
        }

        await processInsurancePayout(user.tenantId, policyId, amount, description);

        return NextResponse.json({ success: true, message: 'Insurance payout processed successfully' });
    } catch (error: any) {
        console.error('Error processing insurance payout:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
