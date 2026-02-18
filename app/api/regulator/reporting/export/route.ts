import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { Tenant } from '@/entities/Tenant';
import { Account } from '@/entities/Account';
import { Loan } from '@/entities/Loan';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenants = await AppDataSource.getRepository(Tenant).find({
            select: ['id', 'name', 'status']
        });

        // Calculate compliance data for each SACCO
        const complianceData = await Promise.all(
            tenants.map(async (t) => {
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

                const liquidityRatio = outstanding > 0 ? (assets / outstanding) * 100 : 100;

                let riskRating: string;
                if (liquidityRatio < 15) {
                    riskRating = 'High';
                } else if (liquidityRatio < 25) {
                    riskRating = 'Medium';
                } else {
                    riskRating = 'Low';
                }

                const isCompliant = t.status === 'active' && liquidityRatio >= 15;

                return {
                    name: t.name,
                    status: t.status,
                    liquidityRatio: liquidityRatio.toFixed(2),
                    riskRating,
                    isCompliant: isCompliant ? 'Yes' : 'No',
                    totalAssets: assets.toFixed(2),
                    outstandingLoans: outstanding.toFixed(2)
                };
            })
        );

        // Generate CSV
        const headers = [
            'SACCO Name',
            'Status',
            'Liquidity Ratio (%)',
            'Risk Rating',
            'Compliant',
            'Total Assets (P)',
            'Outstanding Loans (P)'
        ];

        const csvRows = [
            headers.join(','),
            ...complianceData.map(row =>
                [
                    `"${row.name}"`,
                    row.status,
                    row.liquidityRatio,
                    row.riskRating,
                    row.isCompliant,
                    row.totalAssets,
                    row.outstandingLoans
                ].join(',')
            )
        ];

        const csv = csvRows.join('\n');

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="compliance-report-${new Date().toISOString().split('T')[0]}.csv"`
            }
        });

    } catch (error: any) {
        console.error('Error exporting compliance report:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
