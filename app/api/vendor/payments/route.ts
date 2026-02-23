import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/db/query';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'vendor') {
        throw new ForbiddenError('Unauthorized access');
    }

    // In a production system, we would link transactions directly to vendors.
    // For now, we fetch transactions related to merchandise payments for this tenant.
    const payments = await query(
        'SELECT * FROM transactions WHERE tenantId = ? AND transactionType = ? AND status = ? ORDER BY transactionDate DESC',
        [user.tenantId, 'merchandise_payment', 'completed']
    );

    return NextResponse.json(payments);
});
