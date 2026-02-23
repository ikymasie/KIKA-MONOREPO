/**
 * src/db/services/KYCService.ts
 *
 * All database operations for the `kyc` table, using raw parameterized SQL.
 * Mirrors every method in KYCVerificationService and the admin/member API routes.
 */

import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute, buildSetClause } from '../query';
import type { IKYC, IKYCVerifyInput, IKYCStats, IKYCMemberUpdateInput, IKYCAdminUpdateInput } from '../../interfaces/IKYC';
import { MEMBER_KYC_FIELDS, ADMIN_KYC_FIELDS, isKYCFullyVerified } from '../../interfaces/IKYC';

// ─────────────────────────────────────────────────────────────────────────────
// Internal: parse row → IKYC
// ─────────────────────────────────────────────────────────────────────────────
function parseKYC(row: RowDataPacket): IKYC {
    return {
        ...row,
        isPip: Boolean(row.isPip),
        identityVerified: Boolean(row.identityVerified),
        residenceVerified: Boolean(row.residenceVerified),
        incomeVerified: Boolean(row.incomeVerified),
        pipVerified: Boolean(row.pipVerified),
    } as IKYC;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch KYC by its own UUID. */
export async function getKYCById(id: string): Promise<IKYC | null> {
    const row = await queryOne<RowDataPacket>('SELECT * FROM kyc WHERE id = ? LIMIT 1', [id]);
    return row ? parseKYC(row) : null;
}

/** Fetch KYC by the member's UUID. */
export async function getKYCByMemberId(memberId: string): Promise<IKYC | null> {
    const row = await queryOne<RowDataPacket>('SELECT * FROM kyc WHERE memberId = ? LIMIT 1', [memberId]);
    return row ? parseKYC(row) : null;
}

/**
 * Fetch KYC by the userId of the logged-in member (via the members table lookup).
 * Returns null if the user has no linked member record, or the member has no KYC yet.
 */
export async function getKYCByUserId(userId: string): Promise<{ kyc: IKYC | null; memberId: string | null }> {
    const memberRow = await queryOne<RowDataPacket>(
        'SELECT id FROM members WHERE userId = ? LIMIT 1',
        [userId]
    );
    if (!memberRow) return { kyc: null, memberId: null };

    const kyc = await getKYCByMemberId(memberRow.id);
    return { kyc, memberId: memberRow.id };
}

/**
 * Fetch all KYC records that have at least one unverified section.
 * Optionally scoped to a specific tenant.
 */
export async function getPendingVerifications(
    tenantId?: string,
    limit = 50
): Promise<IKYC[]> {
    const conditions = [
        '(k.identityVerified = 0 OR k.residenceVerified = 0 OR k.incomeVerified = 0)'
    ];
    const params: unknown[] = [];

    if (tenantId) {
        conditions.push('m.tenantId = ?');
        params.push(tenantId);
    }

    const rows = await query<RowDataPacket>(
        `SELECT k.*
         FROM kyc k
         INNER JOIN members m ON m.id = k.memberId
         WHERE ${conditions.join(' AND ')}
         ORDER BY k.createdAt ASC
         LIMIT ?`,
        [...params, limit]
    );
    return rows.map(parseKYC);
}

/**
 * KYC statistics — global or scoped to a tenant.
 */
export async function getKYCStats(tenantId?: string): Promise<IKYCStats> {
    const join = tenantId ? 'INNER JOIN members m ON m.id = k.memberId' : '';
    const where = tenantId ? 'WHERE m.tenantId = ?' : '';
    const params = tenantId ? [tenantId] : [];

    const rows = await query<RowDataPacket>(
        `SELECT
             COUNT(*)                                                         AS totalKYCs,
             SUM(k.identityVerified = 1 AND k.residenceVerified = 1 AND k.incomeVerified = 1) AS fullyVerified,
             SUM(k.identityVerified = 0)                                      AS pendingIdentity,
             SUM(k.residenceVerified = 0)                                     AS pendingResidence,
             SUM(k.incomeVerified = 0)                                        AS pendingIncome
         FROM kyc k ${join} ${where}`,
        params
    );
    const r = rows[0] || {};
    const total = Number(r.totalKYCs ?? 0);
    const verified = Number(r.fullyVerified ?? 0);
    return {
        totalKYCs: total,
        fullyVerified: verified,
        pendingIdentity: Number(r.pendingIdentity ?? 0),
        pendingResidence: Number(r.pendingResidence ?? 0),
        pendingIncome: Number(r.pendingIncome ?? 0),
        verificationRate: total > 0 ? (verified / total) * 100 : 0,
    };
}

/**
 * KYC compliance rate for a tenant (percentage of members who are fully verified).
 */
export async function getComplianceRate(tenantId: string): Promise<number> {
    const memberCount = await queryOne<RowDataPacket & { cnt: string }>(
        'SELECT COUNT(*) AS cnt FROM members WHERE tenantId = ?',
        [tenantId]
    );
    const total = parseInt(memberCount?.cnt ?? '0', 10);
    if (total === 0) return 100;

    const verifiedRow = await queryOne<RowDataPacket & { cnt: string }>(
        `SELECT COUNT(*) AS cnt
         FROM kyc k
         INNER JOIN members m ON m.id = k.memberId
         WHERE m.tenantId = ?
           AND k.identityVerified = 1
           AND k.residenceVerified = 1
           AND k.incomeVerified = 1`,
        [tenantId]
    );
    const verified = parseInt(verifiedRow?.cnt ?? '0', 10);
    return (verified / total) * 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upsert a KYC record — creates one if it doesn't exist, updates if it does.
 * Used by both the member's own route and the admin route.
 *
 * @param memberId   UUID of the member this KYC belongs to.
 * @param fields     Fields to upsert (restricted by the caller's role).
 */
export async function upsertKYC(
    memberId: string,
    fields: Record<string, unknown>
): Promise<IKYC> {
    const existing = await getKYCByMemberId(memberId);

    if (!existing) {
        const id = uuidv4();
        const cols = ['id', 'memberId', ...Object.keys(fields)];
        const vals = [id, memberId, ...Object.values(fields).map(serializeField)];
        const placeholders = cols.map(() => '?').join(', ');
        await execute(
            `INSERT INTO kyc (\`${cols.join('`, `')}\`, createdAt, updatedAt) VALUES (${placeholders}, NOW(), NOW())`,
            vals
        );
        const created = await getKYCByMemberId(memberId);
        if (!created) throw new Error('KYC creation failed');
        return created;
    }

    // Update existing
    const { clause, values } = buildSetClause(
        Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, serializeField(v)]))
    );
    await execute(`UPDATE kyc SET ${clause}, updatedAt = NOW() WHERE id = ?`, [...values, existing.id]);

    const updated = await getKYCById(existing.id);
    if (!updated) throw new Error('KYC update failed');
    return updated;
}

/**
 * Apply a verification decision to a single section (identity / residence / income / pip).
 */
export async function verifySection(
    kycId: string,
    req: IKYCVerifyInput
): Promise<IKYC> {
    const existing = await getKYCById(kycId);
    if (!existing) throw new Error('KYC record not found');

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let setSql: string;
    let args: unknown[];

    switch (req.documentType) {
        case 'identity':
            setSql = 'identityVerified = ?, identityVerifiedBy = ?, identityVerifiedAt = ?';
            args = [req.verified ? 1 : 0, req.verified ? req.verifiedBy : null, req.verified ? now : null];
            break;
        case 'residence':
            setSql = 'residenceVerified = ?, residenceVerifiedBy = ?, residenceVerifiedAt = ?';
            args = [req.verified ? 1 : 0, req.verified ? req.verifiedBy : null, req.verified ? now : null];
            break;
        case 'income':
            setSql = 'incomeVerified = ?, incomeVerifiedBy = ?, incomeVerifiedAt = ?';
            args = [req.verified ? 1 : 0, req.verified ? req.verifiedBy : null, req.verified ? now : null];
            break;
        case 'pip':
            setSql = 'pipVerified = ?, pipVerifiedBy = ?, pipVerifiedAt = ?';
            args = [req.verified ? 1 : 0, req.verified ? req.verifiedBy : null, req.verified ? now : null];
            break;
        default:
            throw new Error(`Unknown documentType: ${req.documentType}`);
    }

    // Append note if provided
    if (req.notes) {
        const noteEntry = `[${new Date().toISOString()}] ${req.documentType}: ${req.notes}`;
        setSql += ', notes = CONCAT(COALESCE(notes, \'\'), IF(notes IS NULL OR notes = \'\', \'\', \'\n\n\'), ?)';
        args.push(noteEntry);
    }

    await execute(
        `UPDATE kyc SET ${setSql}, updatedAt = NOW() WHERE id = ?`,
        [...args, kycId]
    );

    const updated = await getKYCById(kycId);
    if (!updated) throw new Error('KYC not found after verify');
    return updated;
}

/**
 * Batch-verify all sections for multiple KYC records.
 */
export async function batchVerifyAll(
    kycIds: string[],
    verifiedBy: string,
    verified: boolean,
    notes?: string
): Promise<void> {
    if (kycIds.length === 0) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const placeholders = kycIds.map(() => '?').join(', ');

    let noteSQL = '';
    const noteArgs: unknown[] = [];
    if (notes) {
        const entry = `[${new Date().toISOString()}] Batch Verify: ${notes}`;
        noteSQL = `, notes = CONCAT(COALESCE(notes, ''), IF(notes IS NULL OR notes = '', '', '\n\n'), ?)`;
        noteArgs.push(entry);
    }

    await execute(
        `UPDATE kyc SET
            identityVerified = ?,  identityVerifiedBy = ?,  identityVerifiedAt = ?,
            residenceVerified = ?, residenceVerifiedBy = ?, residenceVerifiedAt = ?,
            incomeVerified = ?,    incomeVerifiedBy = ?,    incomeVerifiedAt = ?
            ${noteSQL},
            updatedAt = NOW()
         WHERE id IN (${placeholders})`,
        [
            verified ? 1 : 0, verified ? verifiedBy : null, verified ? now : null,
            verified ? 1 : 0, verified ? verifiedBy : null, verified ? now : null,
            verified ? 1 : 0, verified ? verifiedBy : null, verified ? now : null,
            ...noteArgs,
            ...kycIds,
        ]
    );
}

/**
 * Apply a full admin-level PATCH (docs + verification flags in one call).
 * This is what the admin/members/[id]/kyc PATCH endpoint uses.
 */
export async function adminPatchKYC(
    memberId: string,
    body: Record<string, unknown>,
    verifyingUserId: string
): Promise<IKYC> {
    // Separate document fields from verification flags
    const docFields: Record<string, unknown> = {};
    for (const f of ADMIN_KYC_FIELDS) {
        if (body[f] !== undefined) docFields[f as string] = body[f];
    }

    // Verification flags
    const verificationUpdates: Record<string, unknown> = {};
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const sections = ['identity', 'residence', 'income', 'pip'] as const;
    for (const section of sections) {
        const key = `${section}Verified` as keyof typeof body;
        if (body[key] !== undefined) {
            const isVerified = Boolean(body[key]);
            verificationUpdates[`${section}Verified`] = isVerified ? 1 : 0;
            verificationUpdates[`${section}VerifiedBy`] = isVerified ? verifyingUserId : null;
            verificationUpdates[`${section}VerifiedAt`] = isVerified ? now : null;
        }
    }

    const allFields = { ...docFields, ...verificationUpdates };
    return upsertKYC(memberId, allFields);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function serializeField(v: unknown): unknown {
    if (v === null || v === undefined) return null;
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (v instanceof Date) return v.toISOString().replace('T', ' ').slice(0, 19);
    return v;
}

// Re-export helpers
export { isKYCFullyVerified, MEMBER_KYC_FIELDS, ADMIN_KYC_FIELDS };
