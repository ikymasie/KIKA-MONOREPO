import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { listLoans, getLoanPortfolioSummary } from '@/src/db/services/LoanService';
import { LoanStatus } from '@/src/interfaces/ILoan';

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

    const filters: { status?: LoanStatus; search?: string } = {};
    if (rawStatus && Object.values(LoanStatus).includes(rawStatus as LoanStatus)) filters.status = rawStatus as LoanStatus;
    if (search) filters.search = search;

    const { loans, total } = await listLoans(user.tenantId, filters, { page, limit });
    const summary = await getLoanPortfolioSummary(user.tenantId);

    const formattedLoans = loans.map(loan => ({
        id: loan.id,
        loanNumber: loan.loanNumber,
        memberId: loan.memberId,
        productId: loan.productId,
        principalAmount: loan.principalAmount,
        interestRate: loan.interestRate,
        termMonths: loan.termMonths,
        monthlyInstallment: loan.monthlyInstallment,
        totalAmountDue: loan.totalAmountDue,
        outstandingBalance: loan.outstandingBalance,
        amountPaid: loan.amountPaid,
        status: loan.status,
        applicationDate: loan.applicationDate,
        approvalDate: loan.approvalDate,
        disbursementDate: loan.disbursementDate,
        maturityDate: loan.maturityDate,
        purpose: loan.purpose,
    }));

    return NextResponse.json({
        success: true,
        data: {
            loans: formattedLoans,
            stats: {
                total: summary.total,
                active: summary.active,
                disbursed: summary.disbursed,
                defaulted: summary.defaulted,
                totalPrincipal: summary.totalPrincipal,
                totalOutstanding: summary.totalOutstanding,
            },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
    });
});
