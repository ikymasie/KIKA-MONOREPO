import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Member } = await import('@/src/entities/Member');
        const { Loan, LoanStatus } = await import('@/src/entities/Loan');
        const { MemberSavings } = await import('@/src/entities/MemberSavings');
        const { Transaction } = await import('@/src/entities/Transaction');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // 1. Member Growth (last 6 months)
        const memberGrowth = await AppDataSource.query(`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
            FROM members
            WHERE tenantId = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `, [user.tenantId]);

        // 2. Loan Portfolio by Status
        const loanPortfolio = await AppDataSource.getRepository(Loan).createQueryBuilder('loan')
            .where('loan.tenantId = :tenantId', { tenantId: user.tenantId })
            .select('loan.status', 'status')
            .addSelect('SUM(loan.principalAmount)', 'totalAmount')
            .addSelect('COUNT(*)', 'count')
            .groupBy('loan.status')
            .getRawMany();

        // 3. Savings Trends (last 6 months)
        const savingsTrends = await AppDataSource.query(`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, SUM(amount) as total
            FROM transactions
            WHERE tenantId = ? AND transactionType = 'deposit' AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `, [user.tenantId]);

        // 4. Repayment Performance
        const repaymentPerformance = await AppDataSource.query(`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, SUM(amount) as total
            FROM transactions
            WHERE tenantId = ? AND transactionType = 'loan_repayment' AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `, [user.tenantId]);

        return NextResponse.json({
            memberGrowth,
            loanPortfolio,
            savingsTrends,
            repaymentPerformance,
            summary: {
                totalPortfolio: loanPortfolio.reduce((acc, curr) => acc + Number(curr.totalAmount), 0),
                activeLoansCount: loanPortfolio.find(p => p.status === LoanStatus.ACTIVE)?.count || 0,
            }
        });
    } catch (error: any) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
