import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const { AppDataSource } = await import('@/src/config/database');
        const { Tenant } = await import('@/src/entities/Tenant');
        const { Account } = await import('@/src/entities/Account');
        const { Loan } = await import('@/src/entities/Loan');

    
        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // 1. Compliance Data with Real Risk Ratings
        const tenants = await AppDataSource.getRepository(Tenant).find({ select: ['id', 'name', 'status'] });

        // Calculate risk rating for each SACCO based on financial metrics
        const complianceDataPromises = tenants.map(async (t) => {
            // Get SACCO-specific financial data
            const saccoAssets = await AppDataSource.getRepository(Account)
                .createQueryBuilder('account')
                .select('SUM(account.balance)', 'total')
                .where('account.tenantId = :tenantId', { tenantId: t.id })
                .getRawOne();

            const saccoLoans = await AppDataSource.getRepository(Loan)
                .createQueryBuilder('loan')
                .select('SUM(loan.outstandingBalance)', 'outstanding')
                .where('loan.tenantId = :tenantId', { tenantId: t.id })
                .getRawOne();

            const assets = parseFloat(saccoAssets?.total || '0');
            const outstanding = parseFloat(saccoLoans?.outstanding || '0');

            // Calculate liquidity ratio for this SACCO
            const liquidityRatio = outstanding > 0 ? (assets / outstanding) * 100 : 100;

            // Determine risk rating based on liquidity ratio
            // High Risk: < 15%, Medium Risk: 15-25%, Low Risk: > 25%
            let riskRating: 'Low' | 'Medium' | 'High';
            if (liquidityRatio < 15) {
                riskRating = 'High';
            } else if (liquidityRatio < 25) {
                riskRating = 'Medium';
            } else {
                riskRating = 'Low';
            }

            // Compliance is based on active status and adequate liquidity
            const isCompliant = t.status === 'active' && liquidityRatio >= 15;

            return {
                id: t.id,
                name: t.name,
                status: t.status,
                isCompliant,
                riskRating
            };
        });

        const complianceData = await Promise.all(complianceDataPromises);

        // 2. Financial Health (Sector Wide)
        const totalAssets = await AppDataSource.getRepository(Account)
            .createQueryBuilder('account')
            .select('SUM(account.balance)', 'total')
            .getRawOne();

        const totalLoans = await AppDataSource.getRepository(Loan)
            .createQueryBuilder('loan')
            .select('SUM(loan.principalAmount)', 'total')
            .getRawOne();

        const outstandingLoans = await AppDataSource.getRepository(Loan)
            .createQueryBuilder('loan')
            .select('SUM(loan.outstandingBalance)', 'totalOutstanding')
            .getRawOne();

        // Calculate Liquidity Ratio: (Total Assets / Total Outstanding Loans) × 100
        const totalAssetsValue = parseFloat(totalAssets?.total || '0');
        const totalOutstandingValue = parseFloat(outstandingLoans?.totalOutstanding || '0');
        const liquidityRatio = totalOutstandingValue > 0
            ? parseFloat(((totalAssetsValue / totalOutstandingValue) * 100).toFixed(2))
            : 0;

        // Calculate Capital Adequacy: Simplified as (Total Assets - Total Loans) / Total Assets × 100
        const totalLoansValue = parseFloat(totalLoans?.total || '0');
        const capitalAdequacy = totalAssetsValue > 0
            ? parseFloat((((totalAssetsValue - totalLoansValue) / totalAssetsValue) * 100).toFixed(2))
            : 0;

        const sectorHealth = {
            totalAssets: totalAssetsValue,
            totalLoanBook: totalLoansValue,
            liquidityRatio,
            capitalAdequacy,
        };

        return NextResponse.json({
            compliance: complianceData,
            sectorHealth
        });

    } catch (error: any) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
