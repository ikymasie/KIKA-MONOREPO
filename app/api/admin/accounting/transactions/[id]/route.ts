import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import {
    asyncHandler,
    UnauthorizedError,
    ForbiddenError,
    BadRequestError,
    NotFoundError,
} from '@/lib/errors';
import { getTransactionById } from '@/src/db/services/AccountingService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/accounting/transactions/[id]
 * Returns detailed information for a specific transaction, including journal entries.
 */
export const GET = asyncHandler(async (
    request: NextRequest,
    { params }: { params: { id: string } }
) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');
    if (!user.tenantId) throw new BadRequestError('No tenant associated with user');

    const { id } = params;
    const transaction = await getTransactionById(user.tenantId, id);

    if (!transaction) {
        throw new NotFoundError('Transaction not found');
    }

    return NextResponse.json({
        success: true,
        data: transaction
    });
});
