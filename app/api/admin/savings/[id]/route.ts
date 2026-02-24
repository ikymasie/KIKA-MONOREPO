import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import {
    asyncHandler,
    UnauthorizedError,
    ForbiddenError,
    BadRequestError,
    NotFoundError,
} from '@/lib/errors';
import { query, queryOne } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/savings/[id]
 * Returns detailed information for a specific savings account, including transaction history.
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

    // Fetch the savings account details
    const savingsAccount = await queryOne<RowDataPacket>(
        `SELECT ms.*, m.firstName, m.lastName, m.memberNumber,
                sp.name AS productName, sp.code AS productCode,
                sp.isShareCapital, sp.allowWithdrawals, sp.interestRate as productInterestRate
         FROM member_savings ms
         INNER JOIN members m ON m.id = ms.memberId
         INNER JOIN savings_products sp ON sp.id = ms.productId
         WHERE ms.id = ? AND m.tenantId = ? LIMIT 1`,
        [id, user.tenantId]
    );

    if (!savingsAccount) throw new NotFoundError('Savings account not found');

    // Fetch transaction history
    const transactions = await query<RowDataPacket>(
        `SELECT * FROM transactions 
         WHERE memberId = ? 
         AND (description LIKE ? OR description LIKE ?)
         ORDER BY createdAt DESC LIMIT 50`,
        [
            savingsAccount.memberId,
            `%${savingsAccount.productName}%`,
            `%${savingsAccount.productCode}%`
        ]
    );

    return NextResponse.json({
        success: true,
        data: {
            ...savingsAccount,
            isActive: Boolean(savingsAccount.isActive),
            isShareCapital: Boolean(savingsAccount.isShareCapital),
            allowWithdrawals: Boolean(savingsAccount.allowWithdrawals),
            transactions
        }
    });
});
