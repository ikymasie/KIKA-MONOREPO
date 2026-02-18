import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Loan, LoanStatus, WorkflowStage } = await import('@/src/entities/Loan');
        const { MemberSavings } = await import('@/src/entities/MemberSavings');
        const { Transaction } = await import('@/src/entities/Transaction');
        const { LoanWorkflowLog, WorkflowActionType } = await import('@/src/entities/LoanWorkflowLog');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { disbursementMethod, accountNumber, notes } = body;

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const loanRepo = AppDataSource.getRepository(Loan);
        const loan = await loanRepo.findOne({
            where: { id: params.id, tenantId: user.tenantId },
            relations: ['member', 'product'],
        });

        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        // Validate loan can be disbursed
        if (loan.status !== LoanStatus.COMMITTEE_APPROVED && loan.status !== LoanStatus.APPROVED) {
            return NextResponse.json(
                { error: `Cannot disburse loan with status: ${loan.status}. Loan must be approved first.` },
                { status: 400 }
            );
        }

        // Start transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update loan status
            loan.status = LoanStatus.DISBURSED;
            loan.workflowStage = WorkflowStage.DISBURSEMENT;
            loan.disbursementDate = new Date();
            loan.disbursedBy = user.id;
            loan.outstandingBalance = loan.totalAmountDue;
            loan.deductionScheduled = true;
            loan.deductionScheduledAt = new Date();

            // Calculate maturity date
            const maturityDate = new Date(loan.disbursementDate);
            maturityDate.setMonth(maturityDate.getMonth() + loan.termMonths);
            loan.maturityDate = maturityDate;

            await queryRunner.manager.save(loan);

            // Create disbursement transaction
            const transaction = new Transaction();
            transaction.tenantId = user.tenantId!;
            transaction.memberId = loan.memberId;
            transaction.transactionNumber = `TXN-${Date.now()}`;
            transaction.transactionType = 'loan_disbursement' as any;
            transaction.amount = loan.principalAmount;
            transaction.description = `Loan disbursement - ${loan.loanNumber}`;
            transaction.transactionDate = new Date();
            transaction.status = 'completed' as any;
            transaction.createdBy = user.id;
            transaction.referenceId = params.id;
            transaction.referenceType = 'loan';

            await queryRunner.manager.save(transaction);

            // Log disbursement
            const workflowLog = new LoanWorkflowLog();
            workflowLog.loanId = params.id;
            workflowLog.actionType = WorkflowActionType.DISBURSEMENT;
            workflowLog.actionBy = user.id;
            workflowLog.fromStatus = 'committee_approved';
            workflowLog.toStatus = 'disbursed';
            workflowLog.notes = `Loan disbursed - P ${Number(loan.principalAmount).toLocaleString()}`;
            workflowLog.metadata = {
                disbursementDetails: {
                    amount: Number(loan.principalAmount),
                    method: disbursementMethod,
                    accountNumber,
                    notes,
                },
            };
            await queryRunner.manager.save(workflowLog);

            // TODO: Integrate with payment gateway for actual disbursement
            // TODO: Send notification to member
            // TODO: Create audit log entry

            await queryRunner.commitTransaction();

            return NextResponse.json({
                message: 'Loan disbursed successfully',
                loan: {
                    id: loan.id,
                    loanNumber: loan.loanNumber,
                    status: loan.status,
                    disbursementDate: loan.disbursementDate,
                    maturityDate: loan.maturityDate,
                    disbursedBy: loan.disbursedBy,
                },
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    } catch (error: any) {
        console.error('Loan disbursement API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to disburse loan' },
            { status: 500 }
        );
    }
}
