import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { listMembers } from '@/src/db/services/MemberService';
import type { IMemberListFilters } from '@/src/interfaces/IMember';
import { MemberStatus } from '@/src/interfaces/IMember';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');
    if (!user.tenantId) throw new BadRequestError('No tenant associated with user');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const rawStatus = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const filters: IMemberListFilters = {};
    if (rawStatus && Object.values(MemberStatus).includes(rawStatus as MemberStatus)) {
        filters.status = rawStatus as MemberStatus;
    }
    if (search) filters.search = search;

    const { members, total } = await listMembers(user.tenantId, filters, { page, limit });

    const formattedMembers = members.map((m) => ({
        id: m.id,
        memberNumber: m.memberNumber,
        firstName: m.firstName,
        lastName: m.lastName,
        idNumber: m.nationalId,
        phoneNumber: m.phone,
        email: m.email,
        status: m.status,
        joinDate: m.joinDate,
        employerName: m.employer || 'N/A',
    }));

    return NextResponse.json({
        success: true,
        data: {
            members: formattedMembers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
});
