import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getLoanById, updateLoan } from '@/src/db/services/LoanService';
import { execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { LoanStatus, WorkflowStage } from '@/src/interfaces/ILoan';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { technicalNotes, recommendation } = await request.json();
        if (!technicalNotes) return NextResponse.json({ error: 'Technical notes are required' }, { status: 400 });

        const loan = await getLoanById(params.id, user.tenantId!);
        if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

        if (loan.status !== LoanStatus.UNDER_APPRAISAL) {
            return NextResponse.json({ error: `Cannot review loan with status: ${loan.status}` }, { status: 400 });
        }

        const updated = await updateLoan(params.id, user.tenantId!, {
            loanOfficerNotes: technicalNotes,
            loanOfficerReviewDate: new Date().toISOString(),
            status: LoanStatus.AWAITING_COMMITTEE,
            workflowStage: WorkflowStage.COMMITTEE_APPROVAL,
        });

        await execute(
            `INSERT INTO loan_workflow_logs (id, loanId, actionType, actionBy, fromStatus, toStatus, notes, createdAt)
             VALUES (?, ?, 'officer_review', ?, 'under_appraisal', 'awaiting_committee', ?, NOW())`,
            [uuidv4(), params.id, user.id, `Officer recommendation: ${recommendation ?? 'Forwarded to committee'}`]
        );

        return NextResponse.json({ message: 'Loan forwarded to credit committee', loanStatus: updated.status });
    } catch (error: any) {
        console.error('Officer review API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to submit officer review' }, { status: 500 });
    }
}
