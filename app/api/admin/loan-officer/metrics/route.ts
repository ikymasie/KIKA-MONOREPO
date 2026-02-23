import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError } from '@/lib/errors';
import { query, queryOne } from '@/src/db/query';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Staff access required');
    if (!user.tenantId) throw new BadRequestError('No tenant associated with user');

    // Approval rate: compare approved vs rejected in officer's portfolio
    const [processed, reviewCount, pendingCount] = await Promise.all([
        query<RowDataPacket>(
            `SELECT status, principalAmount, outstandingBalance, maturityDate
             FROM loans WHERE tenantId = ? AND loanOfficerId = ?`,
            [user.tenantId, user.id]
        ),
        queryOne<RowDataPacket & { cnt: string }>(
            `SELECT COUNT(*) AS cnt FROM loan_workflow_logs WHERE actionBy = ? AND actionType = 'officer_review'`,
            [user.id]
        ),
        queryOne<RowDataPacket & { cnt: string }>(
            `SELECT COUNT(*) AS cnt FROM loans WHERE tenantId = ? AND loanOfficerId = ? AND status = 'under_appraisal'`,
            [user.tenantId, user.id]
        ),
    ]);

    const approvedCount = processed.filter(l => ['approved', 'disbursed', 'active'].includes(l.status)).length;
    const rejectedCount = processed.filter(l => l.status === 'rejected').length;
    const recomm = parseInt(reviewCount?.cnt ?? '0', 10);
    const approvalRate = (approvedCount + rejectedCount) > 0 ? (approvedCount / (approvedCount + rejectedCount)) * 100 : 0;

    const activeLoans = processed.filter(l => l.status === 'active');
    const totalOutstanding = activeLoans.reduce((s, l) => s + Number(l.outstandingBalance), 0);
    const pastDue = activeLoans.filter(l => l.maturityDate && new Date() > new Date(l.maturityDate));
    const parAmount = pastDue.reduce((s, l) => s + Number(l.outstandingBalance), 0);
    const parPercentage = totalOutstanding > 0 ? (parAmount / totalOutstanding) * 100 : 0;

    const disbursedAmount = processed
        .filter(l => ['disbursed', 'active'].includes(l.status))
        .reduce((s, l) => s + Number(l.principalAmount), 0);

    return NextResponse.json({
        success: true,
        data: {
            approvalRate: Math.round(approvalRate),
            portfolioAtRiskPercentage: Math.round(parPercentage * 100) / 100,
            pendingTasks: parseInt(pendingCount?.cnt ?? '0', 10),
            totalDisbursed: disbursedAmount,
            recommendationsCount: recomm,
            activePortfolioCount: activeLoans.length,
            totalPortfolioOutstanding: totalOutstanding,
        },
    });
});
