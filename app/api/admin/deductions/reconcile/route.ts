import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { processReconciliation } from '@/src/db/services/DeductionService';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const { month, year, items } = data;

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
        }

        const result = await processReconciliation(user.tenantId, user.id, month, year, items);

        return NextResponse.json({
            message: 'Reconciliation completed successfully',
            batchId: result.batchId,
            summary: {
                totalExpected: result.totalExpected,
                totalActual: result.totalActual,
                totalVariance: result.totalVariance,
                matchedPct: items.length > 0 ? ((items.length - result.totalVariance !== 0 ? 1 : 0) / items.length) * 100 : 0 // Rough estimation logic
            }
        });
    } catch (error: any) {
        console.error('Reconciliation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
