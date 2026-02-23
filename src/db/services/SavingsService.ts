/**
 * src/db/services/SavingsService.ts
 *
 * All database operations for the `member_savings` and `savings_products` tables,
 * using raw parameterized SQL.
 */

import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute, buildSetClause } from '../query';
import type {
    IMemberSavings, ISavingsProduct, ISavingsCreateInput, ISavingsUpdateInput,
} from '../../interfaces/IMemberSavings';
import { SavingsProductStatus } from '../../interfaces/IMemberSavings';

// ─────────────────────────────────────────────────────────────────────────────
// Internal parsers
// ─────────────────────────────────────────────────────────────────────────────
function parseSavingsProduct(row: RowDataPacket): ISavingsProduct {
    const parseJson = (v: unknown) => (typeof v === 'string' ? JSON.parse(v) : v);
    return {
        ...row,
        interestRate: Number(row.interestRate),
        minimumBalance: Number(row.minimumBalance ?? 0),
        maximumBalance: row.maximumBalance != null ? Number(row.maximumBalance) : undefined,
        isShareCapital: Boolean(row.isShareCapital),
        allowWithdrawals: Boolean(row.allowWithdrawals),
        minMonthlyContribution: Number(row.minMonthlyContribution ?? 0),
        interestEarningThreshold: Number(row.interestEarningThreshold ?? 0),
        withdrawalRestrictions: row.withdrawalRestrictions ? parseJson(row.withdrawalRestrictions) : undefined,
    } as ISavingsProduct;
}

function parseMemberSavings(row: RowDataPacket): IMemberSavings {
    return {
        ...row,
        balance: Number(row.balance ?? 0),
        monthlyContribution: Number(row.monthlyContribution ?? 0),
        isActive: Boolean(row.isActive),
        isShareCapital: row.isShareCapital != null ? Boolean(row.isShareCapital) : undefined,
        allowWithdrawals: row.allowWithdrawals != null ? Boolean(row.allowWithdrawals) : undefined,
    } as IMemberSavings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Savings Products
// ─────────────────────────────────────────────────────────────────────────────

export async function listSavingsProducts(tenantId: string, activeOnly = true): Promise<ISavingsProduct[]> {
    const where = activeOnly ? 'WHERE tenantId = ? AND status = \'active\'' : 'WHERE tenantId = ?';
    const rows = await query<RowDataPacket>(`SELECT * FROM savings_products ${where} ORDER BY name ASC`, [tenantId]);
    return rows.map(parseSavingsProduct);
}

export async function getSavingsProductById(id: string, tenantId: string): Promise<ISavingsProduct | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM savings_products WHERE id = ? AND tenantId = ? LIMIT 1',
        [id, tenantId]
    );
    return row ? parseSavingsProduct(row) : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Member Savings – Reads
// ─────────────────────────────────────────────────────────────────────────────

/** All savings accounts for a member, joined with product details. */
export async function getMemberSavings(memberId: string): Promise<IMemberSavings[]> {
    const rows = await query<RowDataPacket>(
        `SELECT ms.*,
                sp.name    AS productName,
                sp.code    AS productCode,
                sp.isShareCapital,
                sp.allowWithdrawals
         FROM member_savings ms
         LEFT JOIN savings_products sp ON sp.id = ms.productId
         WHERE ms.memberId = ?
         ORDER BY sp.isShareCapital DESC, ms.createdAt ASC`,
        [memberId]
    );
    return rows.map(parseMemberSavings);
}

export async function getMemberSavingsById(id: string, memberId: string): Promise<IMemberSavings | null> {
    const row = await queryOne<RowDataPacket>(
        `SELECT ms.*, sp.name AS productName, sp.code AS productCode,
                sp.isShareCapital, sp.allowWithdrawals
         FROM member_savings ms
         LEFT JOIN savings_products sp ON sp.id = ms.productId
         WHERE ms.id = ? AND ms.memberId = ? LIMIT 1`,
        [id, memberId]
    );
    return row ? parseMemberSavings(row) : null;
}

/** Total balance across all savings products for a member. */
export async function getMemberTotalSavings(memberId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { total: string }>(
        'SELECT COALESCE(SUM(balance), 0) AS total FROM member_savings WHERE memberId = ? AND isActive = 1',
        [memberId]
    );
    return Number(row?.total ?? 0);
}

/** Share capital balance specifically. */
export async function getMemberShareCapital(memberId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { total: string }>(
        `SELECT COALESCE(SUM(ms.balance), 0) AS total
         FROM member_savings ms
         INNER JOIN savings_products sp ON sp.id = ms.productId
         WHERE ms.memberId = ? AND sp.isShareCapital = 1 AND ms.isActive = 1`,
        [memberId]
    );
    return Number(row?.total ?? 0);
}

/** Portfolio summary for a tenant. */
export async function getSavingsPortfolioSummary(tenantId: string): Promise<{
    totalAccounts: number; totalBalance: number; totalShareCapital: number; activeAccounts: number;
}> {
    const rows = await query<RowDataPacket>(
        `SELECT
             COUNT(ms.id)                                                     AS totalAccounts,
             COALESCE(SUM(ms.balance), 0)                                     AS totalBalance,
             COALESCE(SUM(IF(sp.isShareCapital = 1, ms.balance, 0)), 0)       AS totalShareCapital,
             SUM(ms.isActive = 1)                                             AS activeAccounts
         FROM member_savings ms
         INNER JOIN members m  ON m.id  = ms.memberId
         INNER JOIN savings_products sp ON sp.id = ms.productId
         WHERE m.tenantId = ?`,
        [tenantId]
    );
    const r = rows[0] || {};
    return {
        totalAccounts: Number(r.totalAccounts ?? 0),
        totalBalance: Number(r.totalBalance ?? 0),
        totalShareCapital: Number(r.totalShareCapital ?? 0),
        activeAccounts: Number(r.activeAccounts ?? 0),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Member Savings – Mutations
// ─────────────────────────────────────────────────────────────────────────────

/** Open a new savings account for a member. */
export async function createMemberSavings(data: ISavingsCreateInput): Promise<IMemberSavings> {
    const id = uuidv4();
    await execute(
        `INSERT INTO member_savings (id, memberId, productId, balance, monthlyContribution, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [id, data.memberId, data.productId, data.balance ?? 0, data.monthlyContribution ?? 0]
    );
    const created = await getMemberSavingsById(id, data.memberId);
    if (!created) throw new Error('Savings account creation failed');
    return created;
}

export async function updateMemberSavings(
    id: string,
    memberId: string,
    data: ISavingsUpdateInput
): Promise<IMemberSavings> {
    const serialized: Record<string, unknown> = { ...data };
    if ('isActive' in serialized) serialized.isActive = serialized.isActive ? 1 : 0;
    const { clause, values } = buildSetClause(serialized);
    await execute(
        `UPDATE member_savings SET ${clause}, updatedAt = NOW() WHERE id = ? AND memberId = ?`,
        [...values, id, memberId]
    );
    const updated = await getMemberSavingsById(id, memberId);
    if (!updated) throw new Error('Savings record not found after update');
    return updated;
}

/**
 * Apply a deposit or withdrawal to a savings account.
 * @param amount  Positive = deposit, negative = withdrawal.
 */
export async function adjustSavingsBalance(
    id: string,
    memberId: string,
    amount: number
): Promise<IMemberSavings> {
    if (amount === 0) throw new Error('Amount must be non-zero');
    await execute(
        `UPDATE member_savings
         SET balance = GREATEST(0, balance + ?), updatedAt = NOW()
         WHERE id = ? AND memberId = ?`,
        [amount, id, memberId]
    );
    const updated = await getMemberSavingsById(id, memberId);
    if (!updated) throw new Error('Savings record not found after balance adjustment');
    return updated;
}

/** Update monthly contribution rate. */
export async function updateMonthlyContribution(
    id: string,
    memberId: string,
    amount: number
): Promise<IMemberSavings> {
    await execute(
        'UPDATE member_savings SET monthlyContribution = ?, updatedAt = NOW() WHERE id = ? AND memberId = ?',
        [amount, id, memberId]
    );
    const updated = await getMemberSavingsById(id, memberId);
    if (!updated) throw new Error('Savings record not found');
    return updated;
}

export { SavingsProductStatus };
