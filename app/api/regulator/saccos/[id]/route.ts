import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import("../../../../../src/db/query");
        const { getUserFromRequest } = await import("../../../../../lib/auth-server");


        const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        // Fetch SACCO details
        const saccos = await query(`
            SELECT t.*, u.email as contactEmail, u.phone as contactPhone 
            FROM tenants t 
            LEFT JOIN users u ON u.tenantId = t.id AND u.role = 'admin' 
            WHERE t.id = ?
            GROUP BY t.id
        `, [id]) as any[];
        const sacco = saccos[0];

        if (!sacco) {
            return NextResponse.json({ error: 'SACCO not found' }, { status: 404 });
        }

        // Get member statistics
        const [[{ totalMembers }]] = await query('SELECT COUNT(*) as totalMembers FROM members WHERE tenantId = ?', [id]) as any[];

        const membersByStatus = await query(
            'SELECT status, COUNT(*) as count FROM members WHERE tenantId = ? GROUP BY status',
            [id]
        ) as any[];

        // Get financial metrics
        // Total savings
        const [[savingsResult]] = await query('SELECT SUM(balance) as total FROM accounts WHERE tenantId = ?', [id]) as any[];
        const totalSavings = parseFloat(savingsResult?.total || '0');

        // Account breakdown
        const accountsByType = await query(
            'SELECT accountType as type, COUNT(*) as count, SUM(balance) as total FROM accounts WHERE tenantId = ? GROUP BY accountType',
            [id]
        ) as any[];

        // Loan statistics
        const [[loanStats]] = await query(
            'SELECT COUNT(*) as totalLoans, SUM(principalAmount) as totalDisbursed, SUM(outstandingBalance) as totalOutstanding FROM loans WHERE tenantId = ?',
            [id]
        ) as any[];

        const [[{ activeLoans }]] = await query('SELECT COUNT(*) as activeLoans FROM loans WHERE tenantId = ? AND status = ?', [id, 'active']) as any[];

        // Calculate Portfolio at Risk (loans overdue > 30 days)
        const [[overdueLoans]] = await query('SELECT SUM(outstandingBalance) as total FROM loans WHERE tenantId = ? AND status = ?', [id, 'overdue']) as any[];

        const portfolioAtRisk = parseFloat(loanStats?.totalOutstanding || '0') > 0
            ? ((parseFloat(overdueLoans?.total || '0') / parseFloat(loanStats.totalOutstanding)) * 100).toFixed(2)
            : '0.00';

        // Recent transactions
        const recentTransactions = await query(`
            SELECT t.*, m.firstName, m.lastName 
            FROM transactions t
            LEFT JOIN members m ON m.id = t.memberId
            WHERE t.tenantId = ?
            ORDER BY t.createdAt DESC
            LIMIT 10
        `, [id]) as any[];

        // Compliance metrics
        const complianceStatus = {
            hasActiveRegistration: sacco.status === 'active',
            liquidityRatio: calculateLiquidityRatio(totalSavings, parseFloat(loanStats?.totalOutstanding || '0')),
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
                contactEmail: sacco.contactEmail || null,
                contactPhone: sacco.contactPhone || null
            },
            members: {
                total: totalMembers,
                byStatus: membersByStatus
            },
            financial: {
                totalSavings,
                accountsByType,
                loans: {
                    total: parseInt(loanStats?.totalLoans || '0'),
                    active: parseInt(activeLoans || '0'),
                    totalDisbursed: parseFloat(loanStats?.totalDisbursed || '0'),
                    totalOutstanding: parseFloat(loanStats?.totalOutstanding || '0'),
                    portfolioAtRisk: parseFloat(portfolioAtRisk)
                }
            },
            compliance: complianceStatus,
            recentActivity: recentTransactions.map(tx => ({
                id: tx.id,
                transactionType: tx.transactionType,
                amount: tx.amount,
                description: tx.description,
                memberName: tx.firstName ? tx.firstName + ' ' + tx.lastName : null,
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
