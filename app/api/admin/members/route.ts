import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member, MemberStatus } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

    // Verify user is SACCOS staff
    if (!user.isTenantAdmin()) {
        throw new ForbiddenError('Admin access required');
    }

    if (!user.tenantId) {
        throw new BadRequestError('No tenant associated with user');
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }

    const memberRepo = AppDataSource.getRepository(Member);

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as MemberStatus | null;
    const search = searchParams.get('search') || '';

    // Build query
    const queryBuilder = memberRepo
        .createQueryBuilder('member')
        .where('member.tenantId = :tenantId', { tenantId: user.tenantId });

    // Apply status filter
    if (status) {
        queryBuilder.andWhere('member.status = :status', { status });
    }

    // Apply search filter
    if (search) {
        queryBuilder.andWhere(
            '(member.firstName LIKE :search OR member.lastName LIKE :search OR member.memberNumber LIKE :search OR member.nationalId LIKE :search)',
            { search: `%${search}%` }
        );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const members = await queryBuilder
        .orderBy('member.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

    // Format response
    const formattedMembers = members.map(member => ({
        id: member.id,
        memberNumber: member.memberNumber,
        firstName: member.firstName,
        lastName: member.lastName,
        idNumber: member.nationalId,
        phoneNumber: member.phone,
        email: member.email,
        status: member.status,
        joinDate: member.joinDate,
        employerName: member.employer || 'N/A',
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
