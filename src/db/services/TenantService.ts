/**
 * src/db/services/TenantService.ts
 *
 * All database operations for the `tenants` table, using raw parameterized SQL.
 * Mirrors every TypeORM repository call in the existing API routes and services.
 */

import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute, buildSetClause, withTransaction } from '../query';
import type { ITenant, ITenantUpdateInput } from '../../interfaces/ITenant';
import { TenantStatus } from '../../interfaces/ITenant';

// ─────────────────────────────────────────────────────────────────────────────
// Internal: parse JSON columns that mysql2 returns as strings
// ─────────────────────────────────────────────────────────────────────────────
function parseTenant(row: RowDataPacket): ITenant {
    const parseJson = (v: unknown) =>
        typeof v === 'string' ? JSON.parse(v) : v;

    return {
        ...row,
        bylaws: row.bylaws ? parseJson(row.bylaws) : undefined,
        kycConfiguration: row.kycConfiguration ? parseJson(row.kycConfiguration) : undefined,
        brandingSettings: row.brandingSettings ? parseJson(row.brandingSettings) : undefined,
        workflowConfiguration: row.workflowConfiguration ? parseJson(row.workflowConfiguration) : undefined,
        isMaintenanceMode: Boolean(row.isMaintenanceMode),
        maxBorrowingLimit: Number(row.maxBorrowingLimit),
        maxDeductionPercentage: Number(row.maxDeductionPercentage),
        liquidityRatioTarget: Number(row.liquidityRatioTarget),
        regulatorDeductionCap: row.regulatorDeductionCap != null ? Number(row.regulatorDeductionCap) : undefined,
        currentComplianceScore: row.currentComplianceScore != null ? Number(row.currentComplianceScore) : undefined,
    } as ITenant;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a single tenant by its UUID.
 * Returns null if not found.
 */
export async function getTenantById(id: string): Promise<ITenant | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM tenants WHERE id = ? LIMIT 1',
        [id]
    );
    return row ? parseTenant(row) : null;
}

/**
 * Fetch a single tenant by its unique code (e.g. "SACCOS-001").
 */
export async function getTenantByCode(code: string): Promise<ITenant | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM tenants WHERE code = ? LIMIT 1',
        [code]
    );
    return row ? parseTenant(row) : null;
}

export interface TenantListFilters {
    status?: TenantStatus;
    search?: string;
}

/**
 * List all tenants with optional status/search filtering.
 */
export async function listTenants(filters: TenantListFilters = {}): Promise<ITenant[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
    }

    if (filters.search) {
        conditions.push('(name LIKE ? OR code LIKE ? OR email LIKE ?)');
        const like = `%${filters.search}%`;
        params.push(like, like, like);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = await query<RowDataPacket>(
        `SELECT * FROM tenants ${where} ORDER BY name ASC`,
        params
    );

    return rows.map(parseTenant);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update allowed fields on a tenant.
 * Only fields present (non-undefined) in the input object will be changed.
 */
export async function updateTenant(id: string, data: ITenantUpdateInput): Promise<ITenant> {
    // Serialize JSON columns before building SET clause
    const serialized: Record<string, unknown> = { ...data };
    for (const jsonCol of ['kycConfiguration', 'brandingSettings', 'workflowConfiguration', 'bylaws'] as const) {
        if (serialized[jsonCol] !== undefined && typeof serialized[jsonCol] === 'object') {
            serialized[jsonCol] = JSON.stringify(serialized[jsonCol]);
        }
    }

    const { clause, values } = buildSetClause(serialized);
    await execute(`UPDATE tenants SET ${clause}, updatedAt = NOW() WHERE id = ?`, [...values, id]);

    const updated = await getTenantById(id);
    if (!updated) throw new Error(`Tenant ${id} not found after update`);
    return updated;
}

/**
 * Toggle maintenance mode for a tenant.
 */
export async function setMaintenanceMode(id: string, enabled: boolean): Promise<ITenant> {
    await execute(
        'UPDATE tenants SET isMaintenanceMode = ?, updatedAt = NOW() WHERE id = ?',
        [enabled ? 1 : 0, id]
    );
    const updated = await getTenantById(id);
    if (!updated) throw new Error(`Tenant ${id} not found`);
    return updated;
}

/**
 * Update compliance score, rating, and last review date.
 */
export async function updateComplianceScore(
    id: string,
    score: number,
    rating: string,
    reviewDate: Date = new Date()
): Promise<ITenant> {
    await execute(
        `UPDATE tenants
         SET currentComplianceScore = ?,
             complianceRating = ?,
             lastComplianceReviewDate = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [score, rating, reviewDate, id]
    );
    const updated = await getTenantById(id);
    if (!updated) throw new Error(`Tenant ${id} not found`);
    return updated;
}

/**
 * Update tenant status (active / suspended / inactive).
 */
export async function updateTenantStatus(id: string, status: TenantStatus): Promise<ITenant> {
    await execute(
        'UPDATE tenants SET status = ?, updatedAt = NOW() WHERE id = ?',
        [status, id]
    );
    const updated = await getTenantById(id);
    if (!updated) throw new Error(`Tenant ${id} not found`);
    return updated;
}

/**
 * Get summary stats for all tenants (used by regulator dashboards).
 */
export async function getTenantStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    inactive: number;
}> {
    const rows = await query<RowDataPacket & { status: TenantStatus; count: string }>(
        `SELECT status, COUNT(*) AS count FROM tenants GROUP BY status`
    );

    const stats = { total: 0, active: 0, suspended: 0, inactive: 0 };
    for (const row of rows) {
        const n = parseInt(row.count, 10);
        stats.total += n;
        if (row.status === TenantStatus.ACTIVE) stats.active = n;
        else if (row.status === TenantStatus.SUSPENDED) stats.suspended = n;
        else if (row.status === TenantStatus.INACTIVE) stats.inactive = n;
    }
    return stats;
}

// Re-export TenantStatus for convenience
export { TenantStatus };
