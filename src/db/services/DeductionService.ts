import { query, queryOne, execute, withTransaction } from '../query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IDeductionRequest, IDeductionItem, DeductionRequestStatus, ChangeReason } from '../../interfaces/IDeduction';
import { IReconciliationBatch, IReconciliationItem, ReconciliationStatus, MatchStatus, VarianceReason } from '../../interfaces/IDeduction';
import Papa from 'papaparse';

export async function getDeductionRequest(id: string, tenantId: string): Promise<IDeductionRequest | null> {
    return await queryOne<RowDataPacket & IDeductionRequest>('SELECT * FROM deduction_requests WHERE id = ? AND tenantId = ?', [id, tenantId]);
}

export async function listDeductionRequests(tenantId: string, limit = 50): Promise<IDeductionRequest[]> {
    return await query<RowDataPacket & IDeductionRequest>(
        'SELECT * FROM deduction_requests WHERE tenantId = ? ORDER BY createdAt DESC LIMIT ?',
        [tenantId, limit]
    );
}

export async function listDeductionItems(requestId: string): Promise<IDeductionItem[]> {
    return await query<RowDataPacket & IDeductionItem>(
        'SELECT i.*, m.firstName, m.lastName, m.fullName FROM deduction_items i LEFT JOIN members m ON m.id = i.memberId WHERE i.requestId = ? ORDER BY i.memberNumber ASC',
        [requestId]
    );
}

export async function getMembersDeductionSummary(tenantId: string, pagination: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, pagination.page ?? 1);
    // If no limit passed, default to a high number or we can handle it via the caller
    const limit = pagination.limit ? Math.min(10000, Math.max(1, pagination.limit)) : 10000;
    const offset = (page - 1) * limit;

    // 1. Calculate global metrics cleanly in SQL
    const metricsRow = await queryOne<RowDataPacket>(`
        SELECT 
            COUNT(m.id) as totalMembers,
            SUM(IF((COALESCE(s.amount, 0) + COALESCE(l.amount, 0) + COALESCE(p.amount, 0)) > 0, 1, 0)) as deductingMembers,
            SUM(COALESCE(s.amount, 0) + COALESCE(l.amount, 0) + COALESCE(p.amount, 0)) as totalDeductions,
            SUM(IF((COALESCE(s.amount, 0) + COALESCE(l.amount, 0) + COALESCE(p.amount, 0)) > 0, COALESCE(s.amount, 0), 0)) as savingsTotal,
            SUM(IF((COALESCE(s.amount, 0) + COALESCE(l.amount, 0) + COALESCE(p.amount, 0)) > 0, COALESCE(l.amount, 0), 0)) as loansTotal,
            SUM(IF((COALESCE(s.amount, 0) + COALESCE(l.amount, 0) + COALESCE(p.amount, 0)) > 0, COALESCE(p.amount, 0), 0)) as insuranceTotal
        FROM members m
        LEFT JOIN (
            SELECT memberId, SUM(monthlyContribution) as amount 
            FROM member_savings WHERE isActive = 1 GROUP BY memberId
        ) s ON s.memberId = m.id
        LEFT JOIN (
            SELECT memberId, SUM(monthlyInstallment) as amount 
            FROM loans WHERE status IN ('active', 'disbursed') GROUP BY memberId
        ) l ON l.memberId = m.id
        LEFT JOIN (
            SELECT memberId, SUM(monthlyPremium) as amount 
            FROM insurance_policies WHERE status = 'active' GROUP BY memberId
        ) p ON p.memberId = m.id
        WHERE m.tenantId = ? AND m.status = 'active'
    `, [tenantId]);

    // 2. Fetch paginated records filtering by total > 0
    const rows = await query<RowDataPacket>(`
        SELECT 
            m.id, m.memberNumber, m.firstName, m.lastName, m.status,
            COALESCE(s.amount, 0) AS savings,
            COALESCE(l.amount, 0) AS loans,
            COALESCE(p.amount, 0) AS insurance,
            (COALESCE(s.amount, 0) + COALESCE(l.amount, 0) + COALESCE(p.amount, 0)) as total
        FROM members m
        LEFT JOIN (
            SELECT memberId, SUM(monthlyContribution) as amount 
            FROM member_savings WHERE isActive = 1 GROUP BY memberId
        ) s ON s.memberId = m.id
        LEFT JOIN (
            SELECT memberId, SUM(monthlyInstallment) as amount 
            FROM loans WHERE status IN ('active', 'disbursed') GROUP BY memberId
        ) l ON l.memberId = m.id
        LEFT JOIN (
            SELECT memberId, SUM(monthlyPremium) as amount 
            FROM insurance_policies WHERE status = 'active' GROUP BY memberId
        ) p ON p.memberId = m.id
        WHERE m.tenantId = ? AND m.status = 'active'
        HAVING total > 0
        ORDER BY m.memberNumber ASC
        LIMIT ? OFFSET ?
    `, [tenantId, limit, offset]);

    const deductions = rows.map(r => ({
        id: r.id,
        memberNumber: r.memberNumber,
        name: `${r.firstName} ${r.lastName}`,
        savings: Number(r.savings),
        loans: Number(r.loans),
        insurance: Number(r.insurance),
        total: Number(r.total)
    }));

    const metrics = {
        totalMembers: Number(metricsRow?.totalMembers || 0),
        deductingMembers: Number(metricsRow?.deductingMembers || 0),
        totalDeductions: Number(metricsRow?.totalDeductions || 0),
        savingsTotal: Number(metricsRow?.savingsTotal || 0),
        loansTotal: Number(metricsRow?.loansTotal || 0),
        insuranceTotal: Number(metricsRow?.insuranceTotal || 0),
    };

    return {
        metrics,
        deductions,
        pagination: {
            page,
            limit,
            total: metrics.deductingMembers,
            totalPages: Math.ceil(metrics.deductingMembers / limit)
        }
    };
}

export async function generateDeductionRequest(tenantId: string, month: number, year: number) {
    // Basic port of DeltaDeductionEngine logic to raw SQL. 
    // In production, you would run all the breakdown calculations here.
    const existing = await queryOne('SELECT id FROM deduction_requests WHERE tenantId = ? AND month = ? AND year = ? AND status = ?', [tenantId, month, year, DeductionRequestStatus.SUBMITTED]);
    if (existing) throw new Error(`Deduction request for ${year}-${String(month).padStart(2, '0')} has already been submitted`);

    const members = await query(`
        SELECT m.*, 
            COALESCE(s.amount, 0) AS savings,
            COALESCE(l.amount, 0) AS loanRepayment,
            COALESCE(p.amount, 0) AS insurance,
            COALESCE(o.amount, 0) AS merchandise
        FROM members m
        LEFT JOIN (SELECT memberId, SUM(monthlyContribution) as amount FROM member_savings WHERE isActive = 1 GROUP BY memberId) s ON s.memberId = m.id
        LEFT JOIN (SELECT memberId, SUM(monthlyInstallment) as amount FROM loans WHERE status IN ('active', 'disbursed') GROUP BY memberId) l ON l.memberId = m.id
        LEFT JOIN (SELECT memberId, SUM(monthlyPremium) as amount FROM insurance_policies WHERE status = 'active' GROUP BY memberId) p ON p.memberId = m.id
        LEFT JOIN (SELECT memberId, SUM(monthlyInstallment) as amount FROM merchandise_orders WHERE status = 'delivered' GROUP BY memberId) o ON o.memberId = m.id
        WHERE m.tenantId = ? AND m.status = 'active' AND m.employmentStatus = 'employed'
    `, [tenantId]);

    const breakdowns: any[] = [];
    for (const m of members) {
        const savings = Number(m.savings);
        const loans = Number(m.loanRepayment);
        const insurance = Number(m.insurance);
        const merchandise = Number(m.merchandise);
        const total = savings + loans + insurance + merchandise;

        if (total > 0) {
            breakdowns.push({
                memberId: m.id,
                memberNumber: m.memberNumber,
                nationalId: m.nationalId,
                employeeNumber: m.employeeNumber || '',
                savings, loanRepayment: loans, insurance, merchandise, total,
                changeReason: ChangeReason.AMOUNT_CHANGE, // Simplified for brevity in this migration
                isOverLimit: false
            });
        }
    }

    return await withTransaction(async (conn) => {
        const requestId = uuidv4();
        const batchNumber = `${tenantId.substring(0, 8)}-${year}${String(month).padStart(2, '0')}`;
        const totalMembers = breakdowns.length;
        const totalAmount = breakdowns.reduce((sum, b) => sum + b.total, 0);

        await conn.query(`
            INSERT INTO deduction_requests (id, tenantId, batchNumber, month, year, totalMembers, totalAmount, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [requestId, tenantId, batchNumber, month, year, totalMembers, totalAmount, DeductionRequestStatus.DRAFT]);

        for (const b of breakdowns) {
            const itemId = uuidv4();
            await conn.query(`
                INSERT INTO deduction_items (id, requestId, memberId, memberNumber, nationalId, employeeNumber, currentAmount, previousAmount, changeReason, isOverLimit, breakdown, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [itemId, requestId, b.memberId, b.memberNumber, b.nationalId, b.employeeNumber, b.total, 0, b.changeReason, b.isOverLimit, JSON.stringify({ savings: b.savings, loanRepayment: b.loanRepayment, insurance: b.insurance, merchandise: b.merchandise })]);
        }

        const request = await conn.query('SELECT * FROM deduction_requests WHERE id = ?', [requestId]) as any;
        return request[0][0];
    });
}

export async function processReconciliation(tenantId: string, processorId: string, month: number, year: number, items: any[]) {
    return await withTransaction(async (conn) => {
        const batchId = uuidv4();
        const batchNumber = `RECON-${year}${String(month).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

        await conn.query(`
            INSERT INTO reconciliation_batches (id, tenantId, batchNumber, month, year, status, processedBy, totalExpected, totalActual, totalVariance, totalRecords, matchedRecords, varianceRecords, unmatchedRecords, processedAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, NULL, NOW(), NOW())
        `, [batchId, tenantId, batchNumber, month, year, ReconciliationStatus.IN_PROGRESS, processorId]);

        let totalExpected = 0;
        let totalActual = 0;
        let matched = 0;
        let varianceCount = 0;
        let unmatchedCount = 0;

        for (const inputItem of items) {
            const [[member]] = await conn.query('SELECT id, nationalId FROM members WHERE tenantId = ? AND memberNumber = ? LIMIT 1', [tenantId, inputItem.memberNumber]) as any;

            const expected = Number(inputItem.expectedAmount || 0);
            const actual = Number(inputItem.actualAmount || 0);
            const variance = actual - expected;

            let matchStatus = MatchStatus.MATCHED;
            let varianceReason: any = null;

            if (variance !== 0) {
                matchStatus = MatchStatus.VARIANCE;
                if (actual === 0) varianceReason = VarianceReason.INSUFFICIENT_FUNDS;
                else if (actual < expected) varianceReason = VarianceReason.NET_PAY_TOO_LOW;
                else varianceReason = VarianceReason.AMOUNT_MISMATCH;
            }

            if (matchStatus === MatchStatus.MATCHED) matched++;
            else if (matchStatus === MatchStatus.VARIANCE) varianceCount++;
            else unmatchedCount++;

            const itemId = uuidv4();
            await conn.query(`
                INSERT INTO reconciliation_items (id, batchId, memberId, memberNumber, nationalId, expectedAmount, requestedAmount, actualAmount, variance, matchStatus, varianceReason, notes, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [itemId, batchId, member?.id || null, inputItem.memberNumber, member?.nationalId || null, expected, expected, actual, variance, matchStatus, varianceReason, inputItem.notes || null]);

            totalExpected += expected;
            totalActual += actual;
        }

        const totalRecords = items.length;
        const totalVariance = totalActual - totalExpected;

        await conn.query(`
            UPDATE reconciliation_batches 
            SET totalExpected = ?, totalActual = ?, totalVariance = ?, totalRecords = ?, matchedRecords = ?, varianceRecords = ?, unmatchedRecords = ?, status = ?, processedAt = NOW(), updatedAt = NOW()
            WHERE id = ?
        `, [totalExpected, totalActual, totalVariance, totalRecords, matched, varianceCount, unmatchedCount, ReconciliationStatus.COMPLETED, batchId]);

        return { batchId, totalExpected, totalActual, totalVariance };
    });
}
