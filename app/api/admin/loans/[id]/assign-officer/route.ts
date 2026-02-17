import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Loan, LoanStatus, WorkflowStage } from '@/src/entities/Loan';
import { LoanGuarantor, GuarantorStatus } from '@/src/entities/LoanGuarantor';
import { LoanWorkflowLog, WorkflowActionType } from '@/src/entities/LoanWorkflowLog';
import { getUserFromRequest } from '@/lib/auth-server';

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

        const body = await request.json();
        const { loanOfficerId } = body;

        if (!loanOfficerId) {
            return NextResponse.json(
                { error: 'Loan officer ID is required' },
                { status: 400 }
            );
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

        // Validate all guarantors have accepted
        const guarantorRepo = AppDataSource.getRepository(LoanGuarantor);
        const guarantors = await guarantorRepo.find({
            where: { loanId: params.id },
        });

        const allAccepted = guarantors.every(
            g => g.status === GuarantorStatus.ACCEPTED
        );

        if (!allAccepted) {
            const pendingCount = guarantors.filter(
                g => g.status === GuarantorStatus.PENDING
            ).length;
            return NextResponse.json(
                {
                    error: `Cannot assign loan officer. ${pendingCount} guarantor(s) have not yet accepted`,
                },
                { status: 400 }
            );
        }

        // Assign loan officer
        loan.loanOfficerId = loanOfficerId;
        loan.status = LoanStatus.UNDER_APPRAISAL;
        loan.workflowStage = WorkflowStage.TECHNICAL_APPRAISAL;
        await loanRepo.save(loan);

        // Log the assignment
        const logRepo = AppDataSource.getRepository(LoanWorkflowLog);
        await logRepo.save({
            loanId: params.id,
            actionType: WorkflowActionType.OFFICER_ASSIGN,
            actionBy: user.id,
            fromStatus: LoanStatus.PENDING_GUARANTORS,
            toStatus: LoanStatus.UNDER_APPRAISAL,
            notes: `Assigned to loan officer ${loanOfficerId}`,
            metadata: { loanOfficerId },
        } as any);

        // TODO: Send notification to loan officer

        return NextResponse.json({
            message: 'Loan officer assigned successfully',
            loanStatus: loan.status,
            loanOfficerId: loan.loanOfficerId,
        });
    } catch (error: any) {
        console.error('Assign officer API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to assign loan officer' },
            { status: 500 }
        );
    }
}
