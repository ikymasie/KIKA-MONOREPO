import { NextRequest, NextResponse } from 'next/server';
import { runFullEligibilityCheck } from '@/lib/loan-eligibility';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Loan, LoanStatus, WorkflowStage } = await import('@/src/entities/Loan');
        const { LoanWorkflowLog, WorkflowActionType } = await import('@/src/entities/LoanWorkflowLog');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const loanRepo = AppDataSource.getRepository(Loan);
        const loan = await loanRepo.findOne({
            where: { id: params.id, tenantId: user.tenantId },
        });

        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        // Run eligibility checks
        const eligibilityResult = await runFullEligibilityCheck(params.id);

        // Update loan with eligibility results
        loan.eligibilityCheckPassed = eligibilityResult.passed;
        loan.eligibilityCheckNotes = {
            savingsRatioCheck: {
                passed: eligibilityResult.checks.savingsRatio.passed,
                details: eligibilityResult.checks.savingsRatio.details,
            },
            activeLoanCheck: {
                passed: eligibilityResult.checks.activeLoan.passed,
                details: eligibilityResult.checks.activeLoan.details,
            },
            membershipDurationCheck: {
                passed: eligibilityResult.checks.membershipDuration.passed,
                details: eligibilityResult.checks.membershipDuration.details,
            },
            timestamp: eligibilityResult.timestamp,
        };

        if (eligibilityResult.passed) {
            loan.status = LoanStatus.DRAFT;
            loan.workflowStage = WorkflowStage.ELIGIBILITY_CHECK;
        } else {
            loan.status = LoanStatus.REJECTED;
            loan.rejectionReason = 'Failed automated eligibility checks';
        }

        await loanRepo.save(loan);

        // Log the eligibility check
        const logRepo = AppDataSource.getRepository(LoanWorkflowLog);
        await logRepo.save({
            loanId: params.id,
            actionType: WorkflowActionType.ELIGIBILITY_CHECK,
            actionBy: user.id,
            toStatus: loan.status,
            notes: eligibilityResult.passed
                ? 'Passed all eligibility checks'
                : 'Failed eligibility checks',
            metadata: { eligibilityResults: eligibilityResult },
        } as any);

        return NextResponse.json({
            message: eligibilityResult.passed
                ? 'Eligibility check passed'
                : 'Eligibility check failed',
            passed: eligibilityResult.passed,
            checks: eligibilityResult.checks,
            loanStatus: loan.status,
        });
    } catch (error: any) {
        console.error('Eligibility check API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to run eligibility check' },
            { status: 500 }
        );
    }
}
