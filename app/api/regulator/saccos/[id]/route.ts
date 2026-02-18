import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { Tenant } = await import('@/src/entities/Tenant');
        const { Member } = await import('@/src/entities/Member');
        const { Account } = await import('@/src/entities/Account');
        const { Loan, LoanStatus } = await import('@/src/entities/Loan');
        const { Transaction } = await import('@/src/entities/Transaction');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const { id } = params;

        // Fetch SACCO details
        const tenantRepo = AppDataSource.getRepository(Tenant);
        const sacco = await tenantRepo.findOne({
            where: { id },
            relations: ['users']
        });

        if (!sacco) {
            return NextResponse.json({ error: 'SACCO not found' }, { status: 404 });
        }

        // Get member statistics
        const memberRepo = AppDataSource.getRepository(Member);
        const totalMembers = await memberRepo.count({ where: { tenantId: id } });

        const membersByStatus = await memberRepo
            .createQueryBuilder('member')
            .select('member.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where('member.tenantId = :tenantId', { tenantId: id })
            .groupBy('member.status')
            .getRawMany();

        // Get financial metrics
        const accountRepo = AppDataSource.getRepository(Account);

        // Total savings
        const savingsResult = await accountRepo
            .createQueryBuilder('account')
            .select('SUM(account.balance)', 'total')
            .where('account.tenantId = :tenantId', { tenantId: id })
            .getRawOne();
        const totalSavings = parseFloat(savingsResult?.total || '0');

        // Account breakdown
        const accountsByType = await accountRepo
            .createQueryBuilder('account')
            .select('account.accountType', 'type')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(account.balance)', 'total')
            .where('account.tenantId = :tenantId', { tenantId: id })
            .groupBy('account.accountType')
            .getRawMany();

        // Loan statistics
        const loanRepo = AppDataSource.getRepository(Loan);

        const loanStats = await loanRepo
            .createQueryBuilder('loan')
            .select('COUNT(*)', 'totalLoans')
            .addSelect('SUM(loan.principalAmount)', 'totalDisbursed')
            .addSelect('SUM(loan.outstandingBalance)', 'totalOutstanding')
            .where('loan.tenantId = :tenantId', { tenantId: id })
            .getRawOne();

        const activeLoans = await loanRepo.count({
            where: { tenantId: id, status: LoanStatus.ACTIVE }
        });

        // Calculate Portfolio at Risk (loans overdue > 30 days)
        const overdueLoans = await loanRepo
            .createQueryBuilder('loan')
            .select('SUM(loan.outstandingBalance)', 'total')
            .where('loan.tenantId = :tenantId', { tenantId: id })
            .andWhere('loan.status = :status', { status: 'overdue' })
            .getRawOne();

        const portfolioAtRisk = loanStats.totalOutstanding > 0
            ? ((parseFloat(overdueLoans?.total || '0') / parseFloat(loanStats.totalOutstanding)) * 100).toFixed(2)
            : '0.00';

        // Recent transactions
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const recentTransactions = await transactionRepo.find({
            where: { tenantId: id },
            order: { createdAt: 'DESC' },
            take: 10,
            relations: ['member']
        });

        // Compliance metrics
        const complianceStatus = {
            hasActiveRegistration: sacco.status === 'active',
            liquidityRatio: calculateLiquidityRatio(totalSavings, parseFloat(loanStats.totalOutstanding || '0')),
            capitalAdequacy: 'N/A', // Would need capital data
            lastAuditDate: null, // Would need audit records
            isCompliant: sacco.status === 'active'
        };

        return NextResponse.json({
            sacco: {
                id: sacco.id,
                name: sacco.name,
                registrationNumber: sacco.registrationNumber,
                status: sacco.status,
                createdAt: sacco.createdAt,
                address: sacco.address,
                contactEmail: sacco.users?.[0]?.email || null,
                contactPhone: sacco.users?.[0]?.phone || null
            },
            members: {
                total: totalMembers,
                byStatus: membersByStatus
            },
            financial: {
                totalSavings,
                accountsByType,
                loans: {
                    total: parseInt(loanStats.totalLoans || '0'),
                    active: activeLoans,
                    totalDisbursed: parseFloat(loanStats.totalDisbursed || '0'),
                    totalOutstanding: parseFloat(loanStats.totalOutstanding || '0'),
                    portfolioAtRisk: parseFloat(portfolioAtRisk)
                }
            },
            compliance: complianceStatus,
            recentActivity: recentTransactions.map(tx => ({
                id: tx.id,
                transactionType: tx.transactionType,
                amount: tx.amount,
                description: tx.description,
                memberName: tx.member?.firstName + ' ' + tx.member?.lastName,
                createdAt: tx.createdAt
            }))
        });

    } catch (error: any) {
        console.error('Error fetching SACCO details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function calculateLiquidityRatio(savings: number, loans: number): string {
    if (loans === 0) return 'N/A';
    const ratio = (savings / loans) * 100;
    return ratio.toFixed(2);
}
