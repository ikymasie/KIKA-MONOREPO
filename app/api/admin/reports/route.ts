import { NextRequest, NextResponse } from 'next/server';
import { In } from 'typeorm';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import("../../../../src/db/query");
        const { getUserFromRequest } = await import("../../../../lib/auth-server");

        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }



        const tenantId = user.tenantId;

        // 1. PAR Calculation (Simplified: Days since last repayment)
        const activeLoans = await query('SELECT * FROM loans WHERE tenantId = ? AND status = ?', [tenantId, 'active']) as any[];

        const parReport = {
            par30: 0,
            par60: 0,
            par90: 0,
            totalPortfolio: 0,
        };

        const now = new Date();
        for (const loan of activeLoans) {
            parReport.totalPortfolio += Number(loan.outstandingBalance);

            // Find last repayment
            const [lastRepayment] = await query(
                `SELECT transactionDate FROM transactions 
                 WHERE referenceId = ? AND transactionType = ? AND status = ? 
                 ORDER BY transactionDate DESC LIMIT 1`,
                [loan.id, 'loan_repayment', 'completed']
            ) as any[];

            const lastDate = lastRepayment ? new Date(lastRepayment.transactionDate) : (loan.disbursementDate ? new Date(loan.disbursementDate) : (loan.createdAt ? new Date(loan.createdAt) : new Date()));
            const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            // If more than 30 days since last payment, it's at risk
            if (diffDays > 120) parReport.par90 += Number(loan.outstandingBalance);
            else if (diffDays > 90) parReport.par60 += Number(loan.outstandingBalance);
            else if (diffDays > 60) parReport.par30 += Number(loan.outstandingBalance);
        }

        // 2. Demand Forecasting (Approved/Pending but Unfunded)
        const pendingLoans = await query(
            'SELECT * FROM loans WHERE tenantId = ? AND status IN (?, ?, ?)',
            [tenantId, 'pending', 'approved', 'committee_approved']
        ) as any[];

        const demandForecasting = {
            totalAmount: pendingLoans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0),
            count: pendingLoans.length,
            categories: {
                pending: pendingLoans.filter(l => l.status === 'pending').length,
                approved: pendingLoans.filter(l => ['approved', 'committee_approved'].includes(l.status)).length,
            }
        };

        // 3. Asset Registry Summary
        const assets = await query('SELECT * FROM assets WHERE tenantId = ?', [tenantId]) as any[];
        const assetSummary = {
            totalValuation: assets.reduce((sum, a) => sum + Number(a.currentValuation), 0),
            count: assets.length,
            collateralReady: assets.filter(a => a.status === 'active').reduce((sum, a) => sum + Number(a.currentValuation), 0),
        };

        return NextResponse.json({
            parReport: {
                ...parReport,
                par30Pct: parReport.totalPortfolio > 0 ? (parReport.par30 / parReport.totalPortfolio) * 100 : 0,
                par60Pct: parReport.totalPortfolio > 0 ? (parReport.par60 / parReport.totalPortfolio) * 100 : 0,
                par90Pct: parReport.totalPortfolio > 0 ? (parReport.par90 / parReport.totalPortfolio) * 100 : 0,
            },
            demandForecasting,
            assetSummary,
        });
    } catch (error: any) {
        console.error('Reports API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
