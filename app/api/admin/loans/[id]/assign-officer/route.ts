import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getLoanById, updateLoan } from '@/src/db/services/LoanService';
import { queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { LoanStatus, WorkflowStage } from '@/src/interfaces/ILoan';
import { RowDataPacket } from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { loanOfficerId } = await request.json();
        if (!loanOfficerId) return NextResponse.json({ error: 'Loan officer ID is required' }, { status: 400 });

        const loan = await getLoanById(params.id, user.tenantId!);
        if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

        // Verify all guarantors accepted
        const pendingGuarantors = await queryOne<RowDataPacket & { cnt: string }>(
            `SELECT COUNT(*) AS cnt FROM loan_guarantors WHERE loanId = ? AND status != 'accepted'`,
            [params.id]
        );
        const pendingCount = parseInt(pendingGuarantors?.cnt ?? '0', 10);
        if (pendingCount > 0) {
            return NextResponse.json({ error: `Cannot assign loan officer. ${pendingCount} guarantor(s) have not yet accepted` }, { status: 400 });
        }

        const updated = await updateLoan(params.id, user.tenantId!, {
            loanOfficerId,
            status: LoanStatus.UNDER_APPRAISAL,
            workflowStage: WorkflowStage.TECHNICAL_APPRAISAL,
        });

        await execute(
            `INSERT INTO loan_workflow_logs (id, loanId, actionType, actionBy, fromStatus, toStatus, notes, createdAt)
             VALUES (?, ?, 'officer_assign', ?, 'pending_guarantors', 'under_appraisal', ?, NOW())`,
            [uuidv4(), params.id, user.id, `Assigned to loan officer ${loanOfficerId}`]
        );

        return NextResponse.json({ message: 'Loan officer assigned successfully', loanStatus: updated.status, loanOfficerId: updated.loanOfficerId });
    } catch (error: any) {
        console.error('Assign officer API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to assign loan officer' }, { status: 500 });
    }
}
