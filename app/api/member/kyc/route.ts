import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, NotFoundError } from '@/lib/errors';
import {
    getKYCByUserId,
    upsertKYC,
    MEMBER_KYC_FIELDS,
} from '@/src/db/services/KYCService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/member/kyc
 * Fetch the current member's KYC record.
 */
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    const { kyc, memberId } = await getKYCByUserId(user.id);

    if (!memberId) throw new NotFoundError('Member profile not found');

    return NextResponse.json({ success: true, data: kyc });
});

/**
 * PATCH /api/member/kyc
 * Member self-service: update their own documents only (no verification flags).
 */
export const PATCH = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    const body = await request.json();
    const { kyc, memberId } = await getKYCByUserId(user.id);

    if (!memberId) throw new NotFoundError('Member profile not found');

    // Only allow member-safe fields
    const safe: Record<string, unknown> = {};
    for (const f of MEMBER_KYC_FIELDS) {
        if (body[f] !== undefined) safe[f] = body[f];
    }

    const updated = await upsertKYC(memberId, safe);
    return NextResponse.json({ success: true, data: updated });
});
