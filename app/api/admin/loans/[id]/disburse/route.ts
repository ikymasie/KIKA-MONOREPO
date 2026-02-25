import { NextRequest, NextResponse } from 'next/server';
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

        const { disbursementMethod, accountNumber, notes } = await request.json();

        const loan = await getLoanById(params.id, user.tenantId!);
        if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

        if (loan.status !== LoanStatus.COMMITTEE_APPROVED && loan.status !== LoanStatus.APPROVED) {
            return NextResponse.json({ error: `Cannot disburse loan with status: ${loan.status}. Loan must be approved first.` }, { status: 400 });
        }

        const disbursementDate = new Date();
        const maturityDate = new Date(disbursementDate);
        maturityDate.setMonth(maturityDate.getMonth() + loan.termMonths);

        // Disburse + create transaction + log — all in one SQL transaction
        const { withTransaction } = await import("../../../../../../src/db/query");
        const updated = await withTransaction(async (conn) => {
            // Update loan
            await conn.execute(
                `UPDATE loans SET status = 'disbursed', workflowStage = 'disbursement',
                 disbursementDate = ?, disbursedBy = ?, maturityDate = ?,
                 outstandingBalance = totalAmountDue, deductionScheduled = 1, deductionScheduledAt = NOW(),
                 updatedAt = NOW() WHERE id = ?`,
                [disbursementDate, user.id, maturityDate, params.id]
            );

            // Transaction record
            await conn.execute(
                `INSERT INTO transactions (id, tenantId, memberId, transactionNumber, transactionType, amount, description, transactionDate, status, createdBy, referenceId, referenceType)
                 VALUES (?, ?, ?, ?, 'loan_disbursement', ?, ?, NOW(), 'completed', ?, ?, 'loan')`,
                [uuidv4(), loan.tenantId, loan.memberId, `TXN-${Date.now()}`, loan.principalAmount,
                `Loan disbursement - ${loan.loanNumber}`, user.id, params.id]
            );

            // Workflow log
            await conn.execute(
                `INSERT INTO loan_workflow_logs (id, loanId, actionType, actionBy, fromStatus, toStatus, notes, createdAt)
                 VALUES (?, ?, 'disbursement', ?, 'committee_approved', 'disbursed', ?, NOW())`,
                [uuidv4(), params.id, user.id, `Loan disbursed - P ${loan.principalAmount.toLocaleString()}. Method: ${disbursementMethod ?? 'N/A'}`]
            );

            const [rows] = await conn.query('SELECT * FROM loans WHERE id = ? LIMIT 1', [params.id]);
            return (rows as any[])[0];
        });

        return NextResponse.json({
            message: 'Loan disbursed successfully',
            loan: { id: updated.id, loanNumber: updated.loanNumber, status: updated.status, disbursementDate: updated.disbursementDate, maturityDate: updated.maturityDate, disbursedBy: updated.disbursedBy },
        });
    } catch (error: any) {
        console.error('Loan disbursement API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to disburse loan' }, { status: 500 });
    }
}
