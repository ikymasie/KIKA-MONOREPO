import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import {
    asyncHandler,
    UnauthorizedError,
    ForbiddenError,
    BadRequestError,
    NotFoundError,
} from '@/lib/errors';
import { getMemberProfile } from '@/src/db/services/MemberService';
import { getLoansByMember } from '@/src/db/services/LoanService';
import { getMemberSavings } from '@/src/db/services/SavingsService';
import { query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/members/[id]/statement
 * Returns consolidated data for a member statement: profile, accounts, and transactions.
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

    const member = await getMemberProfile(id, user.tenantId);
    if (!member) throw new NotFoundError('Member not found');

    const [loans, savingsRes, transactions] = await Promise.all([
        getLoansByMember(id, user.tenantId),
        getMemberSavings(id),
        query<RowDataPacket>(
            'SELECT * FROM transactions WHERE memberId = ? ORDER BY createdAt DESC LIMIT 100',
            [id]
        ),
    ]);

    // Normalize savings
    const savingsNormalized = savingsRes.savings.map((s: any) => ({
        ...s,
        product: { name: s.productName ?? 'Unknown Product' },
    }));

    return NextResponse.json({
        success: true,
        data: {
            member,
            loans,
            savings: savingsNormalized,
            transactions,
            generatedAt: new Date().toISOString(),
            generatedBy: {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
            },
        },
    });
});
