import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Loan, LoanStatus } = await import('@/src/entities/Loan');
        const { LoanGuarantor } = await import('@/src/entities/LoanGuarantor');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
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
            relations: [
                'member',
                'product',
                'guarantors',
                'guarantors.guarantorMember',
            ],
        });

        if (!loan) {
            return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
        }

        // Format response with full details
        const formattedLoan = {
            id: loan.id,
            loanNumber: loan.loanNumber,
            member: {
                id: loan.member.id,
                memberNumber: loan.member.memberNumber,
                firstName: loan.member.firstName,
                lastName: loan.member.lastName,
                fullName: `${loan.member.firstName} ${loan.member.lastName}`,
                email: loan.member.email,
                phone: loan.member.phone,
                nationalId: loan.member.nationalId,
                employer: loan.member.employer,
            },
            product: {
                id: loan.product.id,
                name: loan.product.name,
                code: loan.product.code,
                interestRate: Number(loan.product.interestRate),
                savingsMultiplier: Number(loan.product.savingsMultiplier),
            },
            principalAmount: Number(loan.principalAmount),
            interestRate: Number(loan.interestRate),
            termMonths: loan.termMonths,
            monthlyInstallment: Number(loan.monthlyInstallment),
            processingFee: Number(loan.processingFee),
            insuranceFee: Number(loan.insuranceFee),
            totalAmountDue: Number(loan.totalAmountDue),
            outstandingBalance: Number(loan.outstandingBalance),
            amountPaid: Number(loan.amountPaid),
            status: loan.status,
            applicationDate: loan.applicationDate,
            approvalDate: loan.approvalDate,
            disbursementDate: loan.disbursementDate,
            maturityDate: loan.maturityDate,
            approvedBy: loan.approvedBy,
            disbursedBy: loan.disbursedBy,
            purpose: loan.purpose,
            rejectionReason: loan.rejectionReason,
            isPastDue: loan.isPastDue,
            guarantors: loan.guarantors?.map(g => ({
                id: g.id,
                guarantorMember: {
                    id: g.guarantorMember.id,
                    memberNumber: g.guarantorMember.memberNumber,
                    firstName: g.guarantorMember.firstName,
                    lastName: g.guarantorMember.lastName,
                    fullName: `${g.guarantorMember.firstName} ${g.guarantorMember.lastName}`,
                },
                guaranteedAmount: Number(g.guaranteedAmount),
                status: g.status,
                acceptedAt: g.acceptedAt,
                rejectedAt: g.rejectedAt,
                rejectionReason: g.rejectionReason,
            })) || [],
            createdAt: loan.createdAt,
            updatedAt: loan.updatedAt,
        };

        return NextResponse.json(formattedLoan);
    } catch (error: any) {
        console.error('Loan detail API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch loan details' },
            { status: 500 }
        );
    }
}
