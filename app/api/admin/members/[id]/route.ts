import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError, NotFoundError } from '@/lib/errors';

export const GET = asyncHandler(async (
    request: NextRequest,
    { params }: { params: { id: string } }
) => {
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

    const { id } = params;

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }

    const memberRepo = AppDataSource.getRepository(Member);

    // Fetch member with all relevant relations
    const member = await memberRepo.findOne({
        where: {
            id,
            tenantId: user.tenantId
        },
        relations: [
            'loans',
            'loans.product',
            'savings',
            'savings.product',
            'insurancePolicies',
            'insurancePolicies.product',
            'beneficiaries',
            'dependents',
            'kyc'
        ]
    });

    if (!member) {
        throw new NotFoundError('Member not found');
    }

    // Return the member data
    return NextResponse.json({
        success: true,
        data: member
    });
});
