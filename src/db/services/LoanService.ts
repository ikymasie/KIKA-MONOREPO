/**
 * src/db/services/LoanService.ts
 *
 * All database operations for the `loans` and `loan_products` tables,
 * using raw parameterized SQL. Mirrors every TypeORM call in the existing
 * admin loan API routes and AccountingService loan logic.
 */

import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute, buildSetClause, likeParam, withTransaction } from '../query';
import type {
    ILoan, ILoanProduct, ILoanCreateInput, ILoanUpdateInput, ILoanListFilters,
} from '../../interfaces/ILoan';
import { LoanStatus, WorkflowStage } from '../../interfaces/ILoan';

// ─────────────────────────────────────────────────────────────────────────────
// Internal parsers
// ─────────────────────────────────────────────────────────────────────────────
function parseLoan(row: RowDataPacket): ILoan {
    const parseJson = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);
    return {
        ...row,
        principalAmount: Number(row.principalAmount),
        interestRate: Number(row.interestRate),
        termMonths: Number(row.termMonths),
        monthlyInstallment: Number(row.monthlyInstallment),
        processingFee: Number(row.processingFee ?? 0),
        insuranceFee: Number(row.insuranceFee ?? 0),
        totalAmountDue: Number(row.totalAmountDue ?? 0),
        amountPaid: Number(row.amountPaid ?? 0),
        outstandingBalance: Number(row.outstandingBalance ?? 0),
        eligibilityCheckPassed: Boolean(row.eligibilityCheckPassed),
        deductionScheduled: Boolean(row.deductionScheduled),
        eligibilityCheckNotes: row.eligibilityCheckNotes ? parseJson(row.eligibilityCheckNotes) : undefined,
        committeeVotes: row.committeeVotes ? parseJson(row.committeeVotes) : undefined,
    } as ILoan;
}

function parseLoanProduct(row: RowDataPacket): ILoanProduct {
    return {
        ...row,
        interestRate: Number(row.interestRate),
        minimumAmount: Number(row.minimumAmount),
        maximumAmount: Number(row.maximumAmount),
        minimumTermMonths: Number(row.minimumTermMonths),
        maximumTermMonths: Number(row.maximumTermMonths),
        requiredGuarantors: Number(row.requiredGuarantors ?? 0),
        processingFeePercentage: row.processingFeePercentage != null ? Number(row.processingFeePercentage) : undefined,
        insuranceFeePercentage: row.insuranceFeePercentage != null ? Number(row.insuranceFeePercentage) : undefined,
        requiresCollateral: Boolean(row.requiresCollateral),
        penaltyRate: row.penaltyRate != null ? Number(row.penaltyRate) : undefined,
        savingsMultiplier: Number(row.savingsMultiplier ?? 3),
        maxDurationMonths: Number(row.maxDurationMonths ?? 12),
        gracePeriodDays: Number(row.gracePeriodDays ?? 0),
    } as ILoanProduct;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loan Products
// ─────────────────────────────────────────────────────────────────────────────

export async function listLoanProducts(tenantId: string, activeOnly = true): Promise<ILoanProduct[]> {
    const where = activeOnly ? 'WHERE tenantId = ? AND status = \'active\'' : 'WHERE tenantId = ?';
    const rows = await query<RowDataPacket>(`SELECT * FROM loan_products ${where} ORDER BY name ASC`, [tenantId]);
    return rows.map(parseLoanProduct);
}

export async function getLoanProductById(id: string, tenantId: string): Promise<ILoanProduct | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM loan_products WHERE id = ? AND tenantId = ? LIMIT 1',
        [id, tenantId]
    );
    return row ? parseLoanProduct(row) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loans – Reads
// ─────────────────────────────────────────────────────────────────────────────

export async function getLoanById(id: string, tenantId: string): Promise<ILoan | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM loans WHERE id = ? AND tenantId = ? LIMIT 1',
        [id, tenantId]
    );
    return row ? parseLoan(row) : null;
}

export async function listLoans(
    tenantId: string,
    filters: ILoanListFilters = {},
    pagination: { page?: number; limit?: number } = {}
): Promise<{ loans: ILoan[]; total: number }> {
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['l.tenantId = ?'];
    const params: unknown[] = [tenantId];

    if (filters.status) { conditions.push('l.status = ?'); params.push(filters.status); }
    if (filters.memberId) { conditions.push('l.memberId = ?'); params.push(filters.memberId); }
    if (filters.loanOfficerId) { conditions.push('l.loanOfficerId = ?'); params.push(filters.loanOfficerId); }
    if (filters.search) {
        const like = likeParam(filters.search);
        conditions.push('(l.loanNumber LIKE ? OR m.firstName LIKE ? OR m.lastName LIKE ?)');
        params.push(like, like, like);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const join = filters.search ? 'LEFT JOIN members m ON m.id = l.memberId' : '';

    const countRow = await queryOne<RowDataPacket & { total: string }>(
        `SELECT COUNT(*) AS total FROM loans l ${join} ${where}`,
        params
    );
    const total = parseInt(countRow?.total ?? '0', 10);

    const rows = await query<RowDataPacket>(
        `SELECT l.* FROM loans l ${join} ${where}
         ORDER BY l.createdAt DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );
    return { loans: rows.map(parseLoan), total };
}

export async function getLoansByMember(memberId: string, tenantId: string): Promise<(ILoan & { product: { name: string } })[]> {
    const rows = await query<RowDataPacket>(
        `SELECT l.*,
                lp.name AS productName
         FROM loans l
         LEFT JOIN loan_products lp ON lp.id = l.productId
         WHERE l.memberId = ? AND l.tenantId = ?
         ORDER BY l.createdAt DESC`,
        [memberId, tenantId]
    );
    return rows.map(row => ({
        ...parseLoan(row),
        product: { name: row.productName ?? 'Unknown Product' },
    }));
}

/** Loans that are ACTIVE and overdue (maturityDate in the past). */
export async function getOverdueLoans(tenantId: string): Promise<ILoan[]> {
    const rows = await query<RowDataPacket>(
        `SELECT * FROM loans
         WHERE tenantId = ? AND status = 'active' AND maturityDate < CURDATE()
         ORDER BY maturityDate ASC`,
        [tenantId]
    );
    return rows.map(parseLoan);
}

/** Loans awaiting committee approval. */
export async function getLoansPendingCommittee(tenantId: string): Promise<ILoan[]> {
    const rows = await query<RowDataPacket>(
        `SELECT * FROM loans WHERE tenantId = ? AND status = 'awaiting_committee' ORDER BY createdAt ASC`,
        [tenantId]
    );
    return rows.map(parseLoan);
}

/** Portfolio summary: totals by status. */
export async function getLoanPortfolioSummary(tenantId: string): Promise<{
    total: number; pending: number; approved: number; active: number;
    disbursed: number; defaulted: number; rejected: number;
    totalPrincipal: number; totalOutstanding: number;
}> {
    const rows = await query<RowDataPacket>(
        `SELECT
             COUNT(*)                                          AS total,
             SUM(status = 'pending')                          AS pending,
             SUM(status = 'approved')                         AS approved,
             SUM(status = 'active')                           AS active,
             SUM(status = 'disbursed')                        AS disbursed,
             SUM(status = 'defaulted')                        AS defaulted,
             SUM(status = 'rejected')                         AS rejected,
             COALESCE(SUM(principalAmount),0)                 AS totalPrincipal,
             COALESCE(SUM(outstandingBalance),0)              AS totalOutstanding
         FROM loans WHERE tenantId = ?`,
        [tenantId]
    );
    const r = rows[0] || {};
    return {
        total: Number(r.total ?? 0),
        pending: Number(r.pending ?? 0),
        approved: Number(r.approved ?? 0),
        active: Number(r.active ?? 0),
        disbursed: Number(r.disbursed ?? 0),
        defaulted: Number(r.defaulted ?? 0),
        rejected: Number(r.rejected ?? 0),
        totalPrincipal: Number(r.totalPrincipal ?? 0),
        totalOutstanding: Number(r.totalOutstanding ?? 0),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Loans – Mutations
// ─────────────────────────────────────────────────────────────────────────────

export async function createLoan(data: ILoanCreateInput): Promise<ILoan> {
    const id = uuidv4();
    await execute(
        `INSERT INTO loans (
            id, tenantId, memberId, productId, loanNumber,
            principalAmount, interestRate, termMonths, monthlyInstallment,
            processingFee, insuranceFee, totalAmountDue,
            amountPaid, outstandingBalance, status, applicationDate,
            purpose, loanOfficerId, eligibilityCheckPassed, deductionScheduled,
            createdAt, updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'pending', ?, ?, ?, 0, 0, NOW(), NOW())`,
        [
            id, data.tenantId, data.memberId, data.productId, data.loanNumber,
            data.principalAmount, data.interestRate, data.termMonths, data.monthlyInstallment,
            data.processingFee ?? 0, data.insuranceFee ?? 0,
            data.totalAmountDue ?? data.principalAmount,
            data.totalAmountDue ?? data.principalAmount, // outstanding = total initially
            data.applicationDate ?? new Date().toISOString().slice(0, 10),
            data.purpose ?? null,
            data.loanOfficerId ?? null,
        ]
    );
    const created = await getLoanById(id, data.tenantId);
    if (!created) throw new Error('Loan creation failed');
    return created;
}

export async function updateLoan(id: string, tenantId: string, data: ILoanUpdateInput): Promise<ILoan> {
    const serialized: Record<string, unknown> = { ...data };
    for (const jsonCol of ['eligibilityCheckNotes', 'committeeVotes'] as const) {
        if (serialized[jsonCol] !== undefined && typeof serialized[jsonCol] === 'object') {
            serialized[jsonCol] = JSON.stringify(serialized[jsonCol]);
        }
    }
    if ('eligibilityCheckPassed' in serialized) serialized.eligibilityCheckPassed = serialized.eligibilityCheckPassed ? 1 : 0;
    if ('deductionScheduled' in serialized) serialized.deductionScheduled = serialized.deductionScheduled ? 1 : 0;

    const { clause, values } = buildSetClause(serialized);
    await execute(`UPDATE loans SET ${clause}, updatedAt = NOW() WHERE id = ? AND tenantId = ?`, [...values, id, tenantId]);
    const updated = await getLoanById(id, tenantId);
    if (!updated) throw new Error(`Loan ${id} not found after update`);
    return updated;
}

/** Advance workflow stage — sets status and workflowStage atomically. */
export async function advanceLoanWorkflow(
    id: string,
    tenantId: string,
    status: LoanStatus,
    stage: WorkflowStage,
    extra: Record<string, unknown> = {}
): Promise<ILoan> {
    return updateLoan(id, tenantId, { status, workflowStage: stage, ...extra } as ILoanUpdateInput);
}

/** Record a payment against a loan, updating amountPaid and outstandingBalance. */
export async function recordLoanPayment(
    id: string,
    tenantId: string,
    amount: number
): Promise<ILoan> {
    await execute(
        `UPDATE loans
         SET amountPaid = amountPaid + ?,
             outstandingBalance = GREATEST(0, outstandingBalance - ?),
             status = IF(outstandingBalance - ? <= 0, 'paid_off', status),
             updatedAt = NOW()
         WHERE id = ? AND tenantId = ?`,
        [amount, amount, amount, id, tenantId]
    );
    const updated = await getLoanById(id, tenantId);
    if (!updated) throw new Error('Loan not found after payment');
    return updated;
}

export { LoanStatus, WorkflowStage };
