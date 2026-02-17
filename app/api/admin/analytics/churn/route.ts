import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { Transaction } from '@/src/entities/Transaction';
import { getUserFromRequest } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // 1. Members with NO transactions in the last 90 days (High Risk)
        const inactiveMembers = await AppDataSource.query(`
            SELECT m.id, m.fullName, m.email, m.phone, MAX(t.createdAt) as lastActive
            FROM members m
            LEFT JOIN transactions t ON m.id = t.memberId
            WHERE m.tenantId = ? AND m.status = 'active'
            GROUP BY m.id
            HAVING lastActive IS NULL OR lastActive < DATE_SUB(NOW(), INTERVAL 90 DAY)
            LIMIT 10
        `, [user.tenantId]);

        // 2. Members with declining savings (Savings this month < 50% of 6-month average)
        const decliningSavings = await AppDataSource.query(`
            WITH MonthlySavings AS (
                SELECT 
                    memberId, 
                    DATE_FORMAT(createdAt, '%Y-%m') as month, 
                    SUM(amount) as total
                FROM transactions
                WHERE tenantId = ? AND transactionType = 'deposit'
                GROUP BY memberId, month
            ),
            AverageSavings AS (
                SELECT 
                    memberId, 
                    AVG(total) as avgMonthly
                FROM MonthlySavings
                WHERE month < DATE_FORMAT(NOW(), '%Y-%m')
                GROUP BY memberId
            ),
            CurrentMonthSavings AS (
                SELECT 
                    memberId, 
                    total as currentTotal
                FROM MonthlySavings
                WHERE month = DATE_FORMAT(NOW(), '%Y-%m')
            )
            SELECT m.id, m.fullName, c.currentTotal, a.avgMonthly
            FROM CurrentMonthSavings c
            JOIN AverageSavings a ON c.memberId = a.memberId
            JOIN members m ON c.memberId = m.id
            WHERE c.currentTotal < (a.avgMonthly * 0.5)
            LIMIT 10
        `, [user.tenantId, user.tenantId]);

        // 3. Overall churn risk summary
        const churnSummary = await AppDataSource.query(`
            SELECT 
                (SELECT COUNT(*) FROM members WHERE tenantId = ? AND status = 'active') as totalActive,
                (SELECT COUNT(DISTINCT m.id)
                 FROM members m
                 LEFT JOIN transactions t ON m.id = t.memberId
                 WHERE m.tenantId = ? AND m.status = 'active'
                 GROUP BY m.id
                 HAVING MAX(t.createdAt) < DATE_SUB(NOW(), INTERVAL 60 DAY) OR MAX(t.createdAt) IS NULL
                ) as highRiskCount
        `, [user.tenantId, user.tenantId]);

        return NextResponse.json({
            inactiveMembers,
            decliningSavings,
            summary: {
                totalActive: churnSummary[0]?.totalActive || 0,
                highRiskCount: churnSummary.length, // High risk members based on query
                riskPercentage: churnSummary[0]?.totalActive > 0 ? (churnSummary.length / churnSummary[0].totalActive) * 100 : 0
            }
        });
    } catch (error: any) {
        console.error('Churn analytics error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
