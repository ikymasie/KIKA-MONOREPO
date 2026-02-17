import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Loan, LoanStatus } from '@/src/entities/Loan';
import { LoanWorkflowLog, WorkflowActionType } from '@/src/entities/LoanWorkflowLog';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);

    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

    if (!user.isTenantAdmin()) {
        throw new ForbiddenError('Staff access required');
    }

    if (!user.tenantId) {
        throw new BadRequestError('No tenant associated with user');
    }

    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }

    const loanRepo = AppDataSource.getRepository(Loan);
    const logRepo = AppDataSource.getRepository(LoanWorkflowLog);

    // 1. Approval Rate (Based on Workflow Logs)
    const reviews = await logRepo.find({
        where: {
            actionBy: user.id,
            actionType: WorkflowActionType.OFFICER_REVIEW
        }
    });

    const recommendations = reviews.length;
    // Assuming metadata stores the recommendation (e.g., recommend_approve, recommend_reject)
    // For now, let's look at the result of loans they were assigned to
    const myProcessedLoans = await loanRepo.find({
        where: {
            loanOfficerId: user.id,
            tenantId: user.tenantId
        }
    });

    const approvedCount = myProcessedLoans.filter(l => [LoanStatus.APPROVED, LoanStatus.DISBURSED, LoanStatus.ACTIVE].includes(l.status)).length;
    const rejectedCount = myProcessedLoans.filter(l => l.status === LoanStatus.REJECTED).length;
    const approvalRate = recommendations > 0 ? (approvedCount / (approvedCount + rejectedCount || 1)) * 100 : 0;

    // 2. Portfolio Quality (PAR - Portfolio at Risk)
    // PAR = (Outstanding balance of loans with overdue payments) / Total outstanding balance
    const myActiveLoans = myProcessedLoans.filter(l => l.status === LoanStatus.ACTIVE);
    const totalOutstanding = myActiveLoans.reduce((sum, l) => sum + Number(l.outstandingBalance), 0);

    // Check for past due loans
    const pastDueLoans = myActiveLoans.filter(l => {
        if (!l.maturityDate) return false;
        return new Date() > new Date(l.maturityDate);
    });
    const parAmount = pastDueLoans.reduce((sum, l) => sum + Number(l.outstandingBalance), 0);
    const parPercentage = totalOutstanding > 0 ? (parAmount / totalOutstanding) * 100 : 0;

    // 3. Workload
    const pendingTasks = await loanRepo.count({
        where: {
            loanOfficerId: user.id,
            tenantId: user.tenantId,
            status: LoanStatus.UNDER_APPRAISAL
        }
    });

    // 4. Disbursement Totals
    const disbursedAmount = myProcessedLoans
        .filter(l => l.status === LoanStatus.DISBURSED || l.status === LoanStatus.ACTIVE)
        .reduce((sum, l) => sum + Number(l.principalAmount), 0);

    return NextResponse.json({
        success: true,
        data: {
            approvalRate: Math.round(approvalRate),
            portfolioAtRiskPercentage: Math.round(parPercentage * 100) / 100,
            pendingTasks,
            totalDisbursed: disbursedAmount,
            recommendationsCount: recommendations,
            activePortfolioCount: myActiveLoans.length,
            totalPortfolioOutstanding: totalOutstanding,
        }
    });
});
