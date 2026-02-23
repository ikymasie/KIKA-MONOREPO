import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, BadRequestError } from '@/lib/errors';
import { execute, query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';
import { MemberStatus } from '@/src/interfaces/IMember';

export const dynamic = 'force-dynamic';
export const PATCH = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) throw new ForbiddenError('Admin access required');
    if (!user.tenantId) throw new BadRequestError('No tenant associated with user');

    const { ids, status: newStatus } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !newStatus) {
        throw new BadRequestError('Member IDs and new status are required');
    }

    // Validate all IDs belong to this tenant, get current statuses
    const placeholders = ids.map(() => '?').join(', ');
    const members = await query<RowDataPacket>(
        `SELECT id, memberNumber, status FROM members WHERE id IN (${placeholders}) AND tenantId = ?`,
        [...ids, user.tenantId]
    );

    if (members.length === 0) throw new BadRequestError('No valid members found to update');

    // Block reactivating deceased members
    if (newStatus === 'active') {
        const deceased = members.find(m => m.status === 'deceased');
        if (deceased) throw new BadRequestError(`Cannot reactivate member ${deceased.memberNumber} as they are marked as DECEASED`);
    }

    const validIds = members.map(m => m.id);
    await execute(
        `UPDATE members SET status = ?, updatedAt = NOW() WHERE id IN (${validIds.map(() => '?').join(', ')})`,
        [newStatus, ...validIds]
    );

    console.log(`Bulk status update: ${members.length} members changed to ${newStatus} by user ${user.id}`);

    return NextResponse.json({
        success: true,
        message: `Successfully updated ${members.length} members to ${newStatus}`,
        data: { updatedCount: members.length },
    });
});
