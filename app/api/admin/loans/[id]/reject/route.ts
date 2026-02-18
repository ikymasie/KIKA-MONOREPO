import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Loan, LoanStatus } = await import('@/src/entities/Loan');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { reason } = body;

        if (!reason || reason.trim().length === 0) {
            return NextResponse.json(
                { error: 'Rejection reason is required' },
                { status: 400 }
            );
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const loanRepo = AppDataSource.getRepository(Loan);
        const loan = await loanRepo.findOne({
            where: { id: params.id, tenantId: user.tenantId },
            relations: ['member'],
        });

        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        // Validate loan can be rejected
        if (loan.status !== LoanStatus.PENDING) {
            return NextResponse.json(
                { error: `Cannot reject loan with status: ${loan.status}` },
                { status: 400 }
            );
        }

        // Update loan status
        loan.status = LoanStatus.REJECTED;
        loan.rejectionReason = reason;

        await loanRepo.save(loan);

        // TODO: Send notification to member
        // TODO: Create audit log entry

        return NextResponse.json({
            message: 'Loan rejected successfully',
            loan: {
                id: loan.id,
                loanNumber: loan.loanNumber,
                status: loan.status,
                rejectionReason: loan.rejectionReason,
            },
        });
    } catch (error: any) {
        console.error('Loan rejection API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reject loan' },
            { status: 500 }
        );
    }
}
