import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { processVendorPayment } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        const body = await request.json();
        const { vendorId, amount, description } = body;

        if (!vendorId || !amount) {
            return NextResponse.json({ error: 'Missing vendorId or amount' }, { status: 400 });
        }

        await processVendorPayment(user.tenantId, vendorId, amount, description);

        return NextResponse.json({ success: true, message: 'Vendor payment processed successfully' });
    } catch (error: any) {
        console.error('Error processing vendor payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
