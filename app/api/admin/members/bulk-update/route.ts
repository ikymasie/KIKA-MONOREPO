import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member, MemberStatus } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, ForbiddenError, BadRequestError, DatabaseError } from '@/lib/errors';
import { In } from 'typeorm';

export const dynamic = 'force-dynamic';
export const PATCH = asyncHandler(async (request: NextRequest) => {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) {
        throw new ForbiddenError('Admin access required');
    }

    if (!user.tenantId) {
        throw new BadRequestError('No tenant associated with user');
    }

    const { ids, status: newStatus } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !newStatus) {
        throw new BadRequestError('Member IDs and new status are required');
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const memberRepo = AppDataSource.getRepository(Member);

    // Fetch members to check status and tenant ownership
    const members = await memberRepo.find({
        where: {
            id: In(ids),
            tenantId: user.tenantId
        }
    });

    if (members.length === 0) {
        throw new BadRequestError('No valid members found to update');
    }

    // Constraint: No going from DECEASED to ACTIVE
    if (newStatus === 'active') {
        const deceasedMember = members.find(m => m.status === 'deceased');
        if (deceasedMember) {
            console.warn(`Blocked bulk reactivation attempt from DECEASED to ACTIVE for members by user ${user.id}`);
            throw new BadRequestError(`Cannot reactivate member ${deceasedMember.memberNumber} as they are marked as DECEASED`);
        }
    }

    // Update members
    await memberRepo.update(
        { id: In(members.map(m => m.id)) },
        { status: newStatus as MemberStatus }
    );

    // TODO: Log bulk action to audit logs
    console.log(`Bulk status update: ${members.length} members changed to ${newStatus} by user ${user.id}`);

    return NextResponse.json({
        success: true,
        message: `Successfully updated ${members.length} members to ${newStatus}`,
        data: { updatedCount: members.length }
    });
});
