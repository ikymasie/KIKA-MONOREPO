import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from '@/lib/errors';
import { getMemberProfile } from '@/src/db/services/MemberService';
import { getKYCByMemberId } from '@/src/db/services/KYCService';
import { getLoansByMember } from '@/src/db/services/LoanService';
import { getMemberSavings } from '@/src/db/services/SavingsService';
import { query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
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

    const [kyc, loans, savings, beneficiaries, insurancePolicies] = await Promise.all([
        getKYCByMemberId(id),
        getLoansByMember(id, user.tenantId),
        getMemberSavings(id),
        query<RowDataPacket>('SELECT * FROM beneficiaries WHERE memberId = ?', [id]),
        query<RowDataPacket>(
            `SELECT ip.*, pr.name AS productName FROM insurance_policies ip
             LEFT JOIN insurance_products pr ON pr.id = ip.productId
             WHERE ip.memberId = ?`, [id]
        ),
    ]);

    return NextResponse.json({
        success: true,
        data: { ...member, kyc, loans, savings, beneficiaries, insurancePolicies },
    });
});
