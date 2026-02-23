import { NextRequest, NextResponse } from 'next/server';
import { runFullEligibilityCheck } from '@/lib/loan-eligibility';
import { getUserFromRequest } from '@/lib/auth-server';
import { getLoanById, updateLoan } from '@/src/db/services/LoanService';
import { execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { LoanStatus, WorkflowStage } from '@/src/interfaces/ILoan';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const loan = await getLoanById(params.id, user.tenantId!);
        if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

        const eligibilityResult = await runFullEligibilityCheck(params.id);

        const newStatus = eligibilityResult.passed ? LoanStatus.DRAFT : LoanStatus.REJECTED;
        const updated = await updateLoan(params.id, user.tenantId!, {
            eligibilityCheckPassed: eligibilityResult.passed,
            eligibilityCheckNotes: {
                savingsRatioCheck: eligibilityResult.checks.savingsRatio,
                activeLoanCheck: eligibilityResult.checks.activeLoan,
                membershipDurationCheck: eligibilityResult.checks.membershipDuration,
                timestamp: eligibilityResult.timestamp.toISOString(),
            },
            status: newStatus,
            workflowStage: eligibilityResult.passed ? WorkflowStage.ELIGIBILITY_CHECK : undefined,
            rejectionReason: eligibilityResult.passed ? undefined : 'Failed automated eligibility checks',
        });

        await execute(
            `INSERT INTO loan_workflow_logs (id, loanId, actionType, actionBy, toStatus, notes, createdAt)
             VALUES (?, ?, 'eligibility_check', ?, ?, ?, NOW())`,
            [uuidv4(), params.id, user.id, newStatus,
            eligibilityResult.passed ? 'Passed all eligibility checks' : 'Failed eligibility checks']
        );

        return NextResponse.json({
            message: eligibilityResult.passed ? 'Eligibility check passed' : 'Eligibility check failed',
            passed: eligibilityResult.passed,
            checks: eligibilityResult.checks,
            loanStatus: updated.status,
        });
    } catch (error: any) {
        console.error('Eligibility check API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to run eligibility check' }, { status: 500 });
    }
}
