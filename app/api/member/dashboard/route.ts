import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { Loan, LoanStatus } from '@/src/entities/Loan';
import { MemberSavings } from '@/src/entities/MemberSavings';
import { Transaction } from '@/src/entities/Transaction';
import { getUserFromRequest } from '@/lib/auth-server';
import { formatMemberNumber, daysUntil } from '@/lib/dashboard-utils';

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify user is a member
        if (user.role !== 'member') {
            return NextResponse.json({ error: 'Forbidden - Members only' }, { status: 403 });
        }

        // Initialize database connection
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const memberRepo = AppDataSource.getRepository(Member);
        const loanRepo = AppDataSource.getRepository(Loan);
        const savingsRepo = AppDataSource.getRepository(MemberSavings);
        const transactionRepo = AppDataSource.getRepository(Transaction);

        // Find member record by user ID
        const member = await memberRepo.findOne({
            where: { userId: user.id },
            relations: ['tenant'],
        });

        if (!member) {
            return NextResponse.json({ error: 'Member record not found' }, { status: 404 });
        }

        // Fetch member data
        const [savings, activeLoan, recentTransactions] = await Promise.all([
            // Member's savings accounts
            savingsRepo.find({
                where: { memberId: member.id },
                relations: ['product'],
            }),

            // Active loan
            loanRepo.findOne({
                where: { memberId: member.id, status: LoanStatus.ACTIVE },
                order: { createdAt: 'DESC' },
            }),

            // Recent transactions
            transactionRepo.find({
                where: { memberId: member.id },
                order: { createdAt: 'DESC' },
                take: 10,
            }),
        ]);

        // Calculate totals
        const totalSavings = savings.reduce((sum, account) => sum + Number(account.balance), 0);
        const shareCapital = savings.find(s => s.product?.isShareCapital)?.balance || 0;

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
        const insurancePremium = 250; // TODO: Fetch from insurance module when ready

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
        const recentActivity = recentTransactions.map(txn => ({
            type: txn.transactionType,
            amount: Number(txn.amount),
            date: txn.createdAt,
            description: txn.description || txn.transactionType,
        }));

        return NextResponse.json({
            member: {
                name: `${member.firstName} ${member.lastName}`,
                memberNumber: formatMemberNumber(member.memberNumber || member.id, member.tenant?.code || 'GGE'),
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
