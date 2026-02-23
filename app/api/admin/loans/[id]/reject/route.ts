import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getLoanById, updateLoan } from '@/src/db/services/LoanService';
import { LoanStatus } from '@/src/interfaces/ILoan';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (!user.isTenantAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { reason } = await request.json();
        if (!reason?.trim()) return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });

        const loan = await getLoanById(params.id, user.tenantId!);
        if (!loan) return NextResponse.json({ error: 'Loan not found' }, { status: 404 });

        if (loan.status !== LoanStatus.PENDING) {
            return NextResponse.json({ error: `Cannot reject loan with status: ${loan.status}` }, { status: 400 });
        }

        const updated = await updateLoan(params.id, user.tenantId!, {
            status: LoanStatus.REJECTED,
            rejectionReason: reason,
        });

        return NextResponse.json({
            message: 'Loan rejected successfully',
            loan: { id: updated.id, loanNumber: updated.loanNumber, status: updated.status, rejectionReason: updated.rejectionReason },
        });
    } catch (error: any) {
        console.error('Loan rejection API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to reject loan' }, { status: 500 });
    }
}
