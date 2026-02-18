import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Loan, LoanStatus } from '@/src/entities/Loan';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);

    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

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

    const loanRepo = AppDataSource.getRepository(Loan);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as LoanStatus | null;
    const search = searchParams.get('search') || '';

    // Build query
    const queryBuilder = loanRepo
        .createQueryBuilder('loan')
        .leftJoinAndSelect('loan.member', 'member')
        .leftJoinAndSelect('loan.product', 'product')
        .leftJoinAndSelect('loan.guarantors', 'guarantors')
        .leftJoinAndSelect('guarantors.guarantorMember', 'guarantorMember')
        .where('loan.tenantId = :tenantId', { tenantId: user.tenantId });

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
        .orderBy('loan.applicationDate', 'DESC')
        .addOrderBy('loan.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

    // Format response
    const formattedLoans = loans.map(loan => ({
        id: loan.id,
        loanNumber: loan.loanNumber,
        member: {
            id: loan.member.id,
            memberNumber: loan.member.memberNumber,
            firstName: loan.member.firstName,
            lastName: loan.member.lastName,
            fullName: `${loan.member.firstName} ${loan.member.lastName}`,
        },
        product: {
            id: loan.product.id,
            name: loan.product.name,
            code: loan.product.code,
        },
        principalAmount: Number(loan.principalAmount),
        interestRate: Number(loan.interestRate),
        termMonths: loan.termMonths,
        monthlyInstallment: Number(loan.monthlyInstallment),
        totalAmountDue: Number(loan.totalAmountDue),
        outstandingBalance: Number(loan.outstandingBalance),
        amountPaid: Number(loan.amountPaid),
        status: loan.status,
        applicationDate: loan.applicationDate,
        approvalDate: loan.approvalDate,
        disbursementDate: loan.disbursementDate,
        maturityDate: loan.maturityDate,
        purpose: loan.purpose,
        guarantorsCount: loan.guarantors?.length || 0,
        isPastDue: loan.isPastDue,
    }));

    // Calculate summary stats
    const stats = {
        total: total,
        pending: await loanRepo.count({ where: { tenantId: user.tenantId, status: LoanStatus.PENDING } }),
        approved: await loanRepo.count({ where: { tenantId: user.tenantId, status: LoanStatus.APPROVED } }),
        active: await loanRepo.count({ where: { tenantId: user.tenantId, status: LoanStatus.ACTIVE } }),
        disbursed: await loanRepo.count({ where: { tenantId: user.tenantId, status: LoanStatus.DISBURSED } }),
        rejected: await loanRepo.count({ where: { tenantId: user.tenantId, status: LoanStatus.REJECTED } }),
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
