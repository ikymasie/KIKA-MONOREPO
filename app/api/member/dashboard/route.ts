import { NextRequest, NextResponse } from 'next/server';
import { formatMemberNumber, daysUntil } from '@/lib/dashboard-utils';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import('@/src/db/query');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a member
        if (user.role !== 'member') {
            return NextResponse.json({ error: 'Forbidden - Members only' }, { status: 403 });
        }

        // Find member record by user ID
        const [member] = await query(
            'SELECT m.*, t.code as tenantCode FROM members m LEFT JOIN tenants t ON t.id = m.tenantId WHERE m.userId = ? LIMIT 1',
            [user.id]
        ) as any[];

        if (!member) {
            return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
        }

        // Fetch member data
        const [savings, activeLoans, recentTransactions, activePolicies] = await Promise.all([
            query('SELECT s.*, p.isShareCapital FROM member_savings s LEFT JOIN savings_products p ON p.id = s.productId WHERE s.memberId = ?', [member.id]),
            query('SELECT * FROM loans WHERE memberId = ? AND status = "active" ORDER BY createdAt DESC LIMIT 1', [member.id]),
            query('SELECT * FROM transactions WHERE memberId = ? ORDER BY createdAt DESC LIMIT 10', [member.id]),
            query('SELECT monthlyPremium FROM insurance_policies WHERE memberId = ? AND status = "active"', [member.id])
        ]) as any[][];

        const activeLoan = activeLoans.length > 0 ? activeLoans[0] : null;

        // Calculate totals
        const totalSavings = savings.reduce((sum: number, account: any) => sum + Number(account.balance), 0);
        const shareCapital = savings.find((s: any) => s.isShareCapital)?.balance || 0;

        // Format active loan data
        let activeLoanData = null;
        if (activeLoan) {
            const remainingBalance = Number(activeLoan.outstandingBalance || activeLoan.principalAmount);
            const monthlyInstallment = Number(activeLoan.monthlyInstallment || 0);
            const nextPayment = activeLoan.maturityDate ? new Date(activeLoan.maturityDate) : null; // Fallback

            activeLoanData = {
                amount: remainingBalance,
                monthlyPayment: monthlyInstallment,
                remainingMonths: activeLoan.termMonths || 0, // Fallback
                nextPaymentDate: nextPayment,
                daysUntilPayment: nextPayment ? daysUntil(nextPayment) : 0,
            };
        }

        // Calculate next payment breakdown
        const monthlySavings = savings.reduce((sum, s) => sum + Number(s.monthlyContribution), 0);
        const insurancePremium = activePolicies.reduce((sum: number, p: any) => sum + Number(p.monthlyPremium || 0), 0);

        const nextPayment = activeLoanData
            ? {
                amount: activeLoanData.monthlyPayment + monthlySavings + insurancePremium,
                dueDate: activeLoanData.nextPaymentDate,
                breakdown: {
                    loanRepayment: activeLoanData.monthlyPayment,
                    monthlySavings,
                    insurancePremium,
                },
            }
            : {
                amount: monthlySavings + insurancePremium,
                dueDate: new Date(new Date().setDate(25)), // 25th of current month
                breakdown: {
                    monthlySavings,
                    insurancePremium,
                },
            };

        // Format recent activity
        const recentActivity = recentTransactions.map((txn: any) => ({
            type: txn.transactionType,
            amount: Number(txn.amount),
            date: txn.createdAt,
            description: txn.description || txn.transactionType,
        }));

        return NextResponse.json({
            member: {
                name: `${member.firstName} ${member.lastName}`,
                memberNumber: formatMemberNumber(member.memberNumber || member.id!, member.tenantCode || 'GGE'),
            },
            accounts: {
                totalSavings,
                shareCapital: Number(shareCapital),
                activeLoan: activeLoanData,
            },
            nextPayment,
            recentActivity,
        });
    } catch (error: any) {
        console.error('Member dashboard error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
