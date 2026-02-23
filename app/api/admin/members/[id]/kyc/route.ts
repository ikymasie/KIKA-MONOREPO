import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from '@/lib/errors';
import {
    getKYCByMemberId,
    adminPatchKYC,
} from '@/src/db/services/KYCService';
import { queryOne } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/members/[id]/kyc
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

    // Verify member belongs to this tenant
    const member = await queryOne<RowDataPacket>(
        'SELECT id FROM members WHERE id = ? AND tenantId = ? LIMIT 1',
        [id, user.tenantId]
    );
    if (!member) throw new NotFoundError('Member not found');

    const kyc = await getKYCByMemberId(id);
    return NextResponse.json({ success: true, data: kyc });
});

/**
 * PATCH /api/admin/members/[id]/kyc
 * Admin can update documents AND set verification flags.
 */
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

    // Verify member belongs to tenant
    const member = await queryOne<RowDataPacket>(
        'SELECT id FROM members WHERE id = ? AND tenantId = ? LIMIT 1',
        [id, user.tenantId]
    );
    if (!member) throw new NotFoundError('Member not found');

    const updated = await adminPatchKYC(id, body, user.id);
    return NextResponse.json({ success: true, data: updated });
});
