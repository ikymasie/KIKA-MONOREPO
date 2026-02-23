import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getGeneralLedger } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.tenantId) return NextResponse.json({ error: 'Tenant ID not found' }, { status: 400 });

        const { searchParams } = new URL(request.url);
        const accountId = searchParams.get('accountId') || undefined;
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Convert strict dates
        const startDate = startDateParam ? new Date(startDateParam).toISOString().slice(0, 19).replace('T', ' ') : undefined;
        const endDate = endDateParam ? new Date(endDateParam).toISOString().slice(0, 19).replace('T', ' ') : undefined;

        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const entries = await getGeneralLedger(
            user.tenantId,
            { startDate, endDate, accountId },
            { page, limit }
        );
        return NextResponse.json(entries);
    } catch (error: any) {
        console.error('Error fetching GL:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
