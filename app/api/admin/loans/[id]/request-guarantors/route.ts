import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Loan, LoanStatus, WorkflowStage } from '@/src/entities/Loan';
import { LoanWorkflowLog, WorkflowActionType } from '@/src/entities/LoanWorkflowLog';
import { getUserFromRequest } from '@/lib/auth-server';
import { requestGuarantorPledges } from '@/lib/guarantor-management';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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
            relations: ['guarantors'],
        });

        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        // Validate loan is in DRAFT status
        if (loan.status !== LoanStatus.DRAFT) {
            return NextResponse.json(
                { error: `Cannot request guarantors for loan with status: ${loan.status}` },
                { status: 400 }
            );
        }

        // Check if guarantors are required
        if (!loan.guarantors || loan.guarantors.length === 0) {
            return NextResponse.json(
                { error: 'No guarantors configured for this loan' },
                { status: 400 }
            );
        }

        // Send notifications to all guarantors
        const result = await requestGuarantorPledges(params.id);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        // Update loan status
        loan.status = LoanStatus.PENDING_GUARANTORS;
        loan.workflowStage = WorkflowStage.GUARANTOR_STAKING;
        await loanRepo.save(loan);

        // Log the action
        const logRepo = AppDataSource.getRepository(LoanWorkflowLog);
        await logRepo.save({
            loanId: params.id,
            actionType: WorkflowActionType.STATUS_CHANGE,
            actionBy: user.id,
            fromStatus: LoanStatus.DRAFT,
            toStatus: LoanStatus.PENDING_GUARANTORS,
            notes: `Requested pledges from ${result.guarantorsSent} guarantors`,
        } as any);

        return NextResponse.json({
            message: result.message,
            guarantorsSent: result.guarantorsSent,
            loanStatus: loan.status,
        });
    } catch (error: any) {
        console.error('Request guarantors API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to request guarantor pledges' },
            { status: 500 }
        );
    }
}
