import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/src/db/query';
import { asyncHandler, DatabaseError } from '@/lib/errors';

export const GET = asyncHandler(async (request: NextRequest) => {
    // Note: Authentication check can be added here if needed
    // For now, assuming regulator authentication is handled by middleware

    // 1. Total SACCOs/Societies
    const [{ totalSaccos }] = await query('SELECT COUNT(*) as totalSaccos FROM tenants') as any[];

    // 2. Total Members (across all tenants)
    const [{ totalMembers }] = await query('SELECT COUNT(*) as totalMembers FROM members') as any[];

    // 3. Total Savings (sum of all account balances)
    const [totalSavingsResult] = await query('SELECT SUM(balance) as total FROM accounts') as any[];
    const totalSavings = parseFloat(totalSavingsResult?.total || '0');

    // 4. Outstanding Loans
    const [outstandingLoansResult] = await query('SELECT SUM(outstandingBalance) as total FROM loans') as any[];
    const outstandingLoans = parseFloat(outstandingLoansResult?.total || '0');

    // 5. Portfolio at Risk (PAR)
    // PAR = (Outstanding balance of overdue loans) / Total outstanding loans * 100
    const [overdueLoansResult] = await query('SELECT SUM(outstandingBalance) as total FROM loans WHERE status = ?', ['overdue']) as any[];

    const overdueAmount = parseFloat(overdueLoansResult?.total || '0');
    const portfolioAtRisk = outstandingLoans > 0
        ? parseFloat(((overdueAmount / outstandingLoans) * 100).toFixed(2))
        : 0;

    // 6. Recent Activity (Applications)
    const recentApplications = await query('SELECT * FROM society_applications ORDER BY createdAt DESC LIMIT 5') as any[];

    const recentActivity = recentApplications.map((app: any) => ({
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
