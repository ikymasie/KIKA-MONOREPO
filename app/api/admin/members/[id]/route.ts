import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import {
    asyncHandler,
    UnauthorizedError,
    ForbiddenError,
    BadRequestError,
    NotFoundError,
} from '@/lib/errors';
import { getMemberProfile, updateMemberStatus } from '@/src/db/services/MemberService';
import { getKYCByMemberId } from '@/src/db/services/KYCService';
import { getLoansByMember } from '@/src/db/services/LoanService';
import { getMemberSavings } from '@/src/db/services/SavingsService';
import { query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';
import { MemberStatus } from '@/src/interfaces/IMember';

export const dynamic = 'force-dynamic';

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/admin/members/[id]
// ──────────────────────────────────────────────────────────────────────────────
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

    const [kyc, loans, savingsRes, beneficiaries, insurancePolicies] = await Promise.all([
        getKYCByMemberId(id),
        getLoansByMember(id, user.tenantId),
        getMemberSavings(id),
        query<RowDataPacket>('SELECT * FROM beneficiaries WHERE memberId = ?', [id]),
        query<RowDataPacket>(
            `SELECT ip.*, pr.name AS productName
             FROM insurance_policies ip
             LEFT JOIN insurance_products pr ON pr.id = ip.productId
             WHERE ip.memberId = ?`,
            [id]
        ),
    ]);

    // Savings: service returns a flat `productName` column — UI expects `product.name`
    const savingsNormalized = savingsRes.savings.map((s: any) => ({
        ...s,
        product: { name: s.productName ?? 'Unknown Product' },
    }));

    // Insurance: SQL aliases the join as `productName` — UI expects `product.name`
    const policiesNormalized = insurancePolicies.map((p: RowDataPacket) => ({
        ...p,
        product: { name: p.productName ?? 'Unknown Product' },
    }));

    return NextResponse.json({
        success: true,
        data: {
            ...member,
            kyc,
            loans,         // already has product.name from getLoansByMember JOIN
            savings: savingsNormalized,
            beneficiaries,
            insurancePolicies: policiesNormalized,
        },
    });
});

// ──────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/members/[id]  — status update
// ──────────────────────────────────────────────────────────────────────────────
export const PATCH = asyncHandler(async (
    request: NextRequest,
    { params }: { params: { id: string } }
) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');
    if (!user.tenantId) throw new BadRequestError('No tenant associated with user');

    const { id } = params;
    const body = await request.json();
    const { status, exitReason } = body;

    if (!status) throw new BadRequestError('status is required');

    const validStatuses: MemberStatus[] = [
        MemberStatus.ACTIVE,
        MemberStatus.INACTIVE,
        MemberStatus.SUSPENDED,
        MemberStatus.DECEASED,
        MemberStatus.RESIGNED,
        MemberStatus.RETIRED,
    ];
    if (!validStatuses.includes(status as MemberStatus)) {
        throw new BadRequestError(`Invalid status: ${status}`);
    }

    // Guard: deceased members cannot be reactivated
    const current = await getMemberProfile(id, user.tenantId);
    if (!current) throw new NotFoundError('Member not found');
    if (current.status === MemberStatus.DECEASED && status === MemberStatus.ACTIVE) {
        throw new BadRequestError('Cannot reactivate a member marked as deceased');
    }

    const updated = await updateMemberStatus(id, user.tenantId, status as MemberStatus, exitReason);

    return NextResponse.json({ success: true, data: updated });
});
