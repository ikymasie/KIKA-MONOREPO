import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import("../../../../src/db/query");
        const { getUserFromRequest } = await import("../../../../lib/auth-server");

        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }



        // 1. Member Growth (last 6 months)
        const memberGrowth = await query(`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count
            FROM members
            WHERE tenantId = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `, [user.tenantId]) as any[];

        // 2. Loan Portfolio by Status
        const loanPortfolio = await query(`
            SELECT status, SUM(principalAmount) as totalAmount, COUNT(*) as count
            FROM loans
            WHERE tenantId = ?
            GROUP BY status
        `, [user.tenantId]) as any[];

        // 3. Savings Trends (last 6 months)
        const savingsTrends = await query(`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, SUM(amount) as total
            FROM transactions
            WHERE tenantId = ? AND transactionType = 'deposit' AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `, [user.tenantId]) as any[];

        // 4. Repayment Performance
        const repaymentPerformance = await query(`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, SUM(amount) as total
            FROM transactions
            WHERE tenantId = ? AND transactionType = 'loan_repayment' AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month ASC
        `, [user.tenantId]) as any[];

        return NextResponse.json({
            memberGrowth,
            loanPortfolio,
            savingsTrends,
            repaymentPerformance,
            summary: {
                totalPortfolio: loanPortfolio.reduce((acc: number, curr: any) => acc + Number(curr.totalAmount), 0),
                activeLoansCount: parseInt(loanPortfolio.find((p: any) => p.status === 'active')?.count || '0', 10),
            }
        });
    } catch (error: any) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
