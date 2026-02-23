import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, BadRequestError } from '@/lib/errors';
import { exportMembers } from '@/src/db/services/MemberService';
import type { IMemberListFilters } from '@/src/interfaces/IMember';
import { MemberStatus } from '@/src/interfaces/IMember';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) throw new ForbiddenError('Admin access required');
    if (!user.tenantId) throw new BadRequestError('No tenant associated with user');

    const { searchParams } = new URL(request.url);
    const rawStatus = searchParams.get('status');

    // exportMembers returns all members; we can filter in memory for the status
    // (could also pass to a filtered SQL query — export is low-frequency so this is fine)
    let members = await exportMembers(user.tenantId);
    if (rawStatus && Object.values(MemberStatus).includes(rawStatus as MemberStatus)) {
        members = members.filter((m) => m.status === rawStatus);
    }

    // Format for CSV
    const data = members.map((m) => ({
        'Member Number': m.memberNumber,
        'First Name': m.firstName,
        'Last Name': m.lastName,
        'ID Number': m.nationalId,
        'Email': m.email,
        'Phone': m.phone,
        'Status': m.status.toUpperCase(),
        'Join Date': m.joinDate,
        'Employer': m.employer || 'N/A',
        'Employment Status': m.employmentStatus.toUpperCase(),
        'Share Capital': m.shareCapital,
    }));

    const csv = Papa.unparse(data);

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename=members_export_${new Date().toISOString().split('T')[0]}.csv`,
        },
    });
});
