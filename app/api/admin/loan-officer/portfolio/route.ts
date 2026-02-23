import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { listLoans, getLoanPortfolioSummary } from '@/src/db/services/LoanService';
import { LoanStatus } from '@/src/interfaces/ILoan';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Staff access required');
    if (!user.tenantId) throw new BadRequestError('No tenant associated with user');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status') as LoanStatus | null;
    const search = searchParams.get('search') || '';

    const filters: { status?: LoanStatus; search?: string; loanOfficerId?: string } = {
        loanOfficerId: user.id,  // scoped to this officer only
    };
    if (status && Object.values(LoanStatus).includes(status)) filters.status = status;
    if (search) filters.search = search;

    const { loans, total } = await listLoans(user.tenantId, filters, { page, limit });

    const formattedLoans = loans.map(loan => ({
        id: loan.id,
        loanNumber: loan.loanNumber,
        memberId: loan.memberId,
        productId: loan.productId,
        principalAmount: loan.principalAmount,
        outstandingBalance: loan.outstandingBalance,
        status: loan.status,
        applicationDate: loan.applicationDate,
        lastUpdated: loan.updatedAt,
    }));

    // Quick stats for this officer
    const activeCount = loans.filter(l => l.status === LoanStatus.ACTIVE).length;
    const pendingCount = loans.filter(l => l.status === LoanStatus.UNDER_APPRAISAL).length;

    return NextResponse.json({
        success: true,
        data: {
            loans: formattedLoans,
            stats: { totalAssigned: total, active: activeCount, pending: pendingCount },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
    });
});
