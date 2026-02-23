import { NextRequest, NextResponse } from 'next/server';
import { requestGuarantorPledges } from '@/lib/guarantor-management';
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

        const loan = await getLoanById(params.id, user.tenantId!);
        if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

        if (loan.status !== LoanStatus.DRAFT) {
            return NextResponse.json({ error: `Cannot request guarantors for loan with status: ${loan.status}` }, { status: 400 });
        }

        // Check guarantors exist
        const guarantorCount = await queryOne<RowDataPacket & { cnt: string }>(
            'SELECT COUNT(*) AS cnt FROM loan_guarantors WHERE loanId = ?',
            [params.id]
        );
        if (!parseInt(guarantorCount?.cnt ?? '0', 10)) {
            return NextResponse.json({ error: 'No guarantors configured for this loan' }, { status: 400 });
        }

        // Delegate notification to the existing guarantor lib
        const result = await requestGuarantorPledges(params.id);
        if (!result.success) return NextResponse.json({ error: result.message }, { status: 400 });

        const updated = await updateLoan(params.id, user.tenantId!, {
            status: LoanStatus.PENDING_GUARANTORS,
            workflowStage: WorkflowStage.GUARANTOR_STAKING,
        });

        await execute(
            `INSERT INTO loan_workflow_logs (id, loanId, actionType, actionBy, fromStatus, toStatus, notes, createdAt)
             VALUES (?, ?, 'status_change', ?, 'draft', 'pending_guarantors', ?, NOW())`,
            [uuidv4(), params.id, user.id, `Requested pledges from ${result.guarantorsSent} guarantors`]
        );

        return NextResponse.json({ message: result.message, guarantorsSent: result.guarantorsSent, loanStatus: updated.status });
    } catch (error: any) {
        console.error('Request guarantors API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to request guarantor pledges' }, { status: 500 });
    }
}
