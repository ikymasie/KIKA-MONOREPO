import { NextRequest, NextResponse } from 'next/server';
import { calculateLiquidityRatio } from '@/lib/dashboard-utils';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query, queryOne } = await import('@/src/db/query');
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

        // Fetch metrics
        const [
            totalMembersRow,
            activeLoans,
            totalSavingsRow,
            recentTransactions,
            pendingLoans,
            pendingClaims,
            pendingOrders,
        ] = await Promise.all([
            // Total members
            queryOne('SELECT COUNT(*) as count FROM members WHERE tenantId = ? AND status = ?', [user.tenantId, 'active']) as any,

            // Active loans
            query('SELECT l.*, m.firstName, m.lastName FROM loans l JOIN members m ON m.id = l.memberId WHERE l.tenantId = ? AND l.status = ?', [user.tenantId, 'active']) as any,

            // Total savings
            queryOne('SELECT SUM(s.balance) as total FROM member_savings s JOIN members m ON m.id = s.memberId WHERE m.tenantId = ?', [user.tenantId]) as any,

            // Recent transactions (last 10)
            query('SELECT t.*, m.firstName, m.lastName FROM transactions t LEFT JOIN members m ON m.id = t.memberId WHERE t.tenantId = ? ORDER BY t.createdAt DESC LIMIT 10', [user.tenantId]) as any,

            // Pending loan applications
            query('SELECT l.*, m.firstName, m.lastName FROM loans l JOIN members m ON m.id = l.memberId WHERE l.tenantId = ? AND l.status = ? LIMIT 5', [user.tenantId, 'pending']) as any,

            // Pending insurance claims
            query('SELECT c.*, p.memberId, m.firstName, m.lastName FROM insurance_claims c JOIN insurance_policies p ON p.id = c.policyId JOIN members m ON m.id = p.memberId WHERE c.tenantId = ? AND c.status = ? LIMIT 5', [user.tenantId, 'submitted']) as any,

            // Pending merchandise orders
            query('SELECT o.*, m.firstName, m.lastName FROM merchandise_orders o JOIN members m ON m.id = o.memberId WHERE o.tenantId = ? AND o.status = ? LIMIT 5', [user.tenantId, 'pending']) as any,
        ]);

        const totalMembers = Number(totalMembersRow?.count || 0);

        // Calculate totals
        const totalLoansAmount = activeLoans.reduce((sum: number, loan: any) => sum + Number(loan.principalAmount), 0);
        const savingsBalance = Number(totalSavingsRow?.total || 0);
        const liquidityRatio = calculateLiquidityRatio(savingsBalance, totalLoansAmount);

        // Format pending approvals
        const pendingApprovals = [
            ...pendingLoans.map((loan: any) => ({
                type: 'Loan Application',
                name: loan.firstName + ' ' + loan.lastName,
                amount: Number(loan.principalAmount),
                details: `P ${Number(loan.principalAmount).toLocaleString()} • ${loan.termMonths} months`,
                id: loan.id,
            })),
            ...pendingClaims.map((claim: any) => ({
                type: 'Insurance Claim',
                name: claim.firstName + ' ' + claim.lastName,
                amount: Number(claim.claimAmount),
                details: `P ${Number(claim.claimAmount).toLocaleString()} • ${claim.claimType}`,
                id: claim.id,
            })),
            ...pendingOrders.map((order: any) => ({
                type: 'Merchandise Order',
                name: order.firstName + ' ' + order.lastName,
                amount: Number(order.totalPrice),
                details: `P ${Number(order.totalPrice).toLocaleString()}`,
                id: order.id,
            })),
        ].slice(0, 5); // Limit to 5 total

        // Format recent transactions
        const formattedTransactions = recentTransactions.map((txn: any) => ({
            type: txn.transactionType,
            description: txn.description || txn.transactionType,
            amount: Number(txn.amount),
            date: txn.createdAt,
            member: (txn.firstName && txn.lastName) ? `${txn.firstName} ${txn.lastName}` : 'System',
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
