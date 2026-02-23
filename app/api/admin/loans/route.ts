import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { listLoans, getLoanPortfolioSummary } from '@/src/db/services/LoanService';
import { LoanStatus } from '@/src/interfaces/ILoan';
import { query } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

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

    const memberMap = new Map();
    const productMap = new Map();

    if (loans.length > 0) {
        const memberIds = [...new Set(loans.map(l => l.memberId))];
        const productIds = [...new Set(loans.map(l => l.productId))];

        const [members, products] = await Promise.all([
            query<RowDataPacket>(`SELECT id, memberNumber, firstName, lastName, email, phone FROM members WHERE id IN (?)`, [memberIds]),
            query<RowDataPacket>(`SELECT id, name, code FROM loan_products WHERE id IN (?)`, [productIds])
        ]);

        members.forEach(m => memberMap.set(m.id, m));
        products.forEach(p => productMap.set(p.id, p));
    }

    const formattedLoans = loans.map(loan => {
        const member = memberMap.get(loan.memberId) || {};
        const product = productMap.get(loan.productId) || {};

        return {
            id: loan.id,
            loanNumber: loan.loanNumber,
            member: {
                id: loan.memberId,
                memberNumber: member.memberNumber || 'Unknown',
                fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown Member',
            },
            product: {
                name: product.name || 'Unknown',
                code: product.code || '',
            },
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
            isPastDue: loan.status === 'active' && loan.maturityDate && new Date(loan.maturityDate) < new Date(),
        };
    });

    return NextResponse.json({
        loans: formattedLoans,
        stats: {
            total: summary.total,
            pending: summary.pending,
            approved: summary.approved,
            active: summary.active,
            disbursed: summary.disbursed,
            rejected: summary.rejected,
            defaulted: summary.defaulted,
            totalPrincipal: summary.totalPrincipal,
            totalOutstanding: summary.totalOutstanding,
        },
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
});
