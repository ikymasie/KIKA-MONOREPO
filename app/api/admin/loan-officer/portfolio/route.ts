import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Loan, LoanStatus } from '@/src/entities/Loan';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);

    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

    // Check if user is either SACCOS_ADMIN or LOAN_OFFICER
    if (!user.isTenantAdmin()) {
        throw new ForbiddenError('Staff access required');
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

    const loanRepo = AppDataSource.getRepository(Loan);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as LoanStatus | null;
    const search = searchParams.get('search') || '';

    // Build query - Scoped to this Loan Officer
    const queryBuilder = loanRepo
        .createQueryBuilder('loan')
        .leftJoinAndSelect('loan.member', 'member')
        .leftJoinAndSelect('loan.product', 'product')
        .where('loan.tenantId = :tenantId', { tenantId: user.tenantId })
        .andWhere('loan.loanOfficerId = :userId', { userId: user.id });

    // Apply status filter
    if (status) {
        queryBuilder.andWhere('loan.status = :status', { status });
    }

    // Apply search filter
    if (search) {
        queryBuilder.andWhere(
            '(member.firstName LIKE :search OR member.lastName LIKE :search OR member.memberNumber LIKE :search OR loan.loanNumber LIKE :search)',
            { search: `%${search}%` }
        );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const loans = await queryBuilder
        .orderBy('loan.updatedAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

    // Format response
    const formattedLoans = loans.map(loan => ({
        id: loan.id,
        loanNumber: loan.loanNumber,
        member: {
            id: loan.member.id,
            fullName: `${loan.member.firstName} ${loan.member.lastName}`,
            memberNumber: loan.member.memberNumber,
        },
        product: {
            id: loan.product.id,
            name: loan.product.name,
        },
        principalAmount: Number(loan.principalAmount),
        outstandingBalance: Number(loan.outstandingBalance),
        status: loan.status,
        applicationDate: loan.applicationDate,
        lastUpdated: loan.updatedAt,
    }));

    // Personal Stats
    const stats = {
        totalAssigned: total,
        active: await loanRepo.count({
            where: {
                tenantId: user.tenantId,
                loanOfficerId: user.id,
                status: LoanStatus.ACTIVE
            }
        }),
        pending: await loanRepo.count({
            where: {
                tenantId: user.tenantId,
                loanOfficerId: user.id,
                status: LoanStatus.UNDER_APPRAISAL
            }
        }),
    };

    return NextResponse.json({
        success: true,
        data: {
            loans: formattedLoans,
            stats,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        },
    });
});
