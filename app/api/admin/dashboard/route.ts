import { NextRequest, NextResponse } from 'next/server';
import { calculateLiquidityRatio } from '@/lib/dashboard-utils';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Member, MemberStatus } = await import('@/src/entities/Member');
        const { Loan, LoanStatus } = await import('@/src/entities/Loan');
        const { MemberSavings } = await import('@/src/entities/MemberSavings');
        const { Transaction } = await import('@/src/entities/Transaction');
        const { InsuranceClaim, ClaimStatus } = await import('@/src/entities/InsuranceClaim');
        const { MerchandiseOrder, OrderStatus } = await import('@/src/entities/MerchandiseOrder');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is SACCOS staff
        if (!user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
        }

        // Initialize database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);
        const loanRepo = AppDataSource.getRepository(Loan);
        const savingsRepo = AppDataSource.getRepository(MemberSavings);
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const claimRepo = AppDataSource.getRepository(InsuranceClaim);
        const orderRepo = AppDataSource.getRepository(MerchandiseOrder);

        // Fetch metrics
        const [
            totalMembers,
            activeLoans,
            totalSavings,
            recentTransactions,
            pendingLoans,
            pendingClaims,
            pendingOrders,
        ] = await Promise.all([
            // Total members
            memberRepo.count({ where: { tenantId: user.tenantId, status: MemberStatus.ACTIVE } }),

            // Active loans
            loanRepo.find({
                where: { tenantId: user.tenantId, status: LoanStatus.ACTIVE },
                relations: ['member'],
            }),

            // Total savings
            savingsRepo
                .createQueryBuilder('savings')
                .innerJoin('savings.member', 'member')
                .where('member.tenantId = :tenantId', { tenantId: user.tenantId })
                .select('SUM(savings.balance)', 'total')
                .getRawOne(),

            // Recent transactions (last 10)
            transactionRepo.find({
                where: { tenantId: user.tenantId },
                order: { createdAt: 'DESC' },
                take: 10,
                relations: ['member'],
            }),

            // Pending loan applications
            loanRepo.find({
                where: { tenantId: user.tenantId, status: LoanStatus.PENDING },
                relations: ['member'],
                take: 5,
            }),

            // Pending insurance claims
            claimRepo.find({
                where: { tenantId: user.tenantId, status: ClaimStatus.SUBMITTED },
                relations: ['policy', 'policy.member'],
                take: 5,
            }),

            // Pending merchandise orders
            orderRepo.find({
                where: { tenantId: user.tenantId, status: OrderStatus.PENDING },
                relations: ['member'],
                take: 5,
            }),
        ]);

        // Calculate totals
        const totalLoansAmount = activeLoans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0);
        const savingsBalance = Number(totalSavings?.total || 0);
        const liquidityRatio = calculateLiquidityRatio(savingsBalance, totalLoansAmount);

        // Format pending approvals
        const pendingApprovals = [
            ...pendingLoans.map(loan => ({
                type: 'Loan Application',
                name: loan.member?.firstName + ' ' + loan.member?.lastName,
                amount: Number(loan.principalAmount),
                details: `P ${Number(loan.principalAmount).toLocaleString()} • ${loan.termMonths} months`,
                id: loan.id,
            })),
            ...pendingClaims.map(claim => ({
                type: 'Insurance Claim',
                name: claim.policy?.member?.firstName + ' ' + claim.policy?.member?.lastName,
                amount: Number(claim.claimAmount),
                details: `P ${Number(claim.claimAmount).toLocaleString()} • ${claim.claimType}`,
                id: claim.id,
            })),
            ...pendingOrders.map(order => ({
                type: 'Merchandise Order',
                name: order.member?.firstName + ' ' + order.member?.lastName,
                amount: Number(order.totalPrice),
                details: `P ${Number(order.totalPrice).toLocaleString()}`,
                id: order.id,
            })),
        ].slice(0, 5); // Limit to 5 total

        // Format recent transactions
        const formattedTransactions = recentTransactions.map(txn => ({
            type: txn.transactionType,
            description: txn.description || txn.transactionType,
            amount: Number(txn.amount),
            date: txn.createdAt,
            member: txn.member ? `${txn.member.firstName} ${txn.member.lastName}` : 'System',
        }));

        return NextResponse.json({
            metrics: {
                totalMembers,
                totalSavings: savingsBalance,
                activeLoans: totalLoansAmount,
                liquidityRatio: Number(liquidityRatio.toFixed(1)),
            },
            pendingApprovals,
            recentTransactions: formattedTransactions,
        });
    } catch (error: any) {
        console.error('Admin dashboard error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
