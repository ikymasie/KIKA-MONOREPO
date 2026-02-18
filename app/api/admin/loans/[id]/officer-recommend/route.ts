import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

        const body = await request.json();
        const { technicalNotes, recommendation } = body;

        if (!technicalNotes) {
            return NextResponse.json(
                { error: 'Technical notes are required' },
                { status: 400 }
            );
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

        // Validate loan is under appraisal
        if (loan.status !== LoanStatus.UNDER_APPRAISAL) {
            return NextResponse.json(
                { error: `Cannot review loan with status: ${loan.status}` },
                { status: 400 }
            );
        }

        // Update loan with officer's review
        loan.loanOfficerNotes = technicalNotes;
        loan.loanOfficerReviewDate = new Date();
        loan.status = LoanStatus.AWAITING_COMMITTEE;
        loan.workflowStage = WorkflowStage.COMMITTEE_APPROVAL;

        await loanRepo.save(loan);

        // Log the review
        const logRepo = AppDataSource.getRepository(LoanWorkflowLog);
        await logRepo.save({
            loanId: params.id,
            actionType: WorkflowActionType.OFFICER_REVIEW,
            actionBy: user.id,
            fromStatus: LoanStatus.UNDER_APPRAISAL,
            toStatus: LoanStatus.AWAITING_COMMITTEE,
            notes: `Officer recommendation: ${recommendation || 'Forwarded to committee'}`,
            metadata: { technicalNotes, recommendation },
        } as any);

        // TODO: Send notification to committee members

        return NextResponse.json({
            message: 'Loan forwarded to credit committee',
            loanStatus: loan.status,
        });
    } catch (error: any) {
        console.error('Officer review API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to submit officer review' },
            { status: 500 }
        );
    }
}
