import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("@/lib/auth-server");
        const { query } = await import("@/src/db/query");


        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Compliance Data with Real Risk Ratings
        const tenants = await query('SELECT id, name, status FROM tenants') as any[];

        // Calculate risk rating for each SACCO based on financial metrics
        const complianceDataPromises = tenants.map(async (t) => {
            // Get SACCO-specific financial data
            const [saccoAssets] = await query('SELECT SUM(balance) as total FROM accounts WHERE tenantId = ?', [t.id]) as any[];
            const [saccoLoans] = await query('SELECT SUM(outstandingBalance) as outstanding FROM loans WHERE tenantId = ?', [t.id]) as any[];

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
        const [totalAssets] = await query('SELECT SUM(balance) as total FROM accounts') as any[];
        const [totalLoans] = await query('SELECT SUM(principalAmount) as total FROM loans') as any[];
        const [outstandingLoans] = await query('SELECT SUM(outstandingBalance) as totalOutstanding FROM loans') as any[];

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
