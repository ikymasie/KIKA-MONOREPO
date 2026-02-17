import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { Tenant } from '@/entities/Tenant';
import { Member } from '@/entities/Member';
import { Account } from '@/entities/Account';
import { Loan } from '@/entities/Loan';
import { SocietyApplication } from '@/entities/SocietyApplication';
import { asyncHandler, DatabaseError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    // Note: Authentication check can be added here if needed
    // For now, assuming regulator authentication is handled by middleware

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const memberRepo = AppDataSource.getRepository(Member);
    const accountRepo = AppDataSource.getRepository(Account);
    const loanRepo = AppDataSource.getRepository(Loan);
    const applicationRepo = AppDataSource.getRepository(SocietyApplication);

    // 1. Total SACCOs/Societies
    const totalSaccos = await tenantRepo.count();

    // 2. Total Members (across all tenants)
    const totalMembers = await memberRepo.count();

    // 3. Total Savings (sum of all account balances)
    const totalSavingsResult = await accountRepo
        .createQueryBuilder('account')
        .select('SUM(account.balance)', 'total')
        .getRawOne();
    const totalSavings = parseFloat(totalSavingsResult?.total || '0');

    // 4. Outstanding Loans
    const outstandingLoansResult = await loanRepo
        .createQueryBuilder('loan')
        .select('SUM(loan.outstandingBalance)', 'total')
        .getRawOne();
    const outstandingLoans = parseFloat(outstandingLoansResult?.total || '0');

    // 5. Portfolio at Risk (PAR)
    // PAR = (Outstanding balance of overdue loans) / Total outstanding loans * 100
    const overdueLoansResult = await loanRepo
        .createQueryBuilder('loan')
        .select('SUM(loan.outstandingBalance)', 'total')
        .where('loan.status = :status', { status: 'overdue' })
        .getRawOne();

    const overdueAmount = parseFloat(overdueLoansResult?.total || '0');
    const portfolioAtRisk = outstandingLoans > 0
        ? parseFloat(((overdueAmount / outstandingLoans) * 100).toFixed(2))
        : 0;

    // 6. Recent Activity (Applications)
    const recentApplications = await applicationRepo.find({
        take: 5,
        order: { createdAt: 'DESC' }
    });

    const recentActivity = recentApplications.map(app => ({
        type: 'Application',
        description: `New application: ${app.proposedName}`,
        date: app.createdAt,
        status: app.status,
        amount: 0
    }));

    return NextResponse.json({
        success: true,
        data: {
            metrics: {
                totalSaccos,
                totalMembers,
                totalSavings,
                outstandingLoans,
                portfolioAtRisk
            },
            recentActivity
        }
    });
});
