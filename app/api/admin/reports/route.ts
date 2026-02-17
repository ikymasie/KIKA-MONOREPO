import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Loan, LoanStatus } from '@/src/entities/Loan';
import { Transaction, TransactionType, TransactionStatus } from '@/src/entities/Transaction';
import { Asset } from '@/src/entities/Asset';
import { getUserFromRequest } from '@/lib/auth-server';
import { In } from 'typeorm';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const loanRepo = AppDataSource.getRepository(Loan);
        const assetRepo = AppDataSource.getRepository(Asset);
        const txnRepo = AppDataSource.getRepository(Transaction);

        const tenantId = user.tenantId;

        // 1. PAR Calculation (Simplified: Days since last repayment)
        const activeLoans = await loanRepo.find({
            where: { tenantId, status: LoanStatus.ACTIVE },
            relations: ['member'],
        });

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
            const lastRepayment = await txnRepo.findOne({
                where: {
                    referenceId: loan.id,
                    transactionType: TransactionType.LOAN_REPAYMENT,
                    status: TransactionStatus.COMPLETED
                },
                order: { transactionDate: 'DESC' },
            });

            const lastDate = lastRepayment ? new Date(lastRepayment.transactionDate) : new Date(loan.disbursementDate || loan.createdAt);
            const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

            // If more than 30 days since last payment, it's at risk
            if (diffDays > 120) parReport.par90 += Number(loan.outstandingBalance);
            else if (diffDays > 90) parReport.par60 += Number(loan.outstandingBalance);
            else if (diffDays > 60) parReport.par30 += Number(loan.outstandingBalance);
        }

        // 2. Demand Forecasting (Approved/Pending but Unfunded)
        const pendingLoans = await loanRepo.find({
            where: {
                tenantId,
                status: In([LoanStatus.PENDING, LoanStatus.APPROVED, LoanStatus.COMMITTEE_APPROVED])
            }
        });

        const demandForecasting = {
            totalAmount: pendingLoans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0),
            count: pendingLoans.length,
            categories: {
                pending: pendingLoans.filter(l => l.status === LoanStatus.PENDING).length,
                approved: pendingLoans.filter(l => [LoanStatus.APPROVED, LoanStatus.COMMITTEE_APPROVED].includes(l.status)).length,
            }
        };

        // 3. Asset Registry Summary
        const assets = await assetRepo.find({ where: { tenantId } });
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
