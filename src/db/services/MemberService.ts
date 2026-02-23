/**
 * src/db/services/MemberService.ts
 *
 * All database operations for the `members` table, using raw parameterized SQL.
 * The `createMember` method is transactional: it inserts both a `users` row and
 * a `members` row atomically, matching the existing TypeORM route behaviour.
 */

import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2/promise';
import { query, queryOne, execute, buildSetClause, withTransaction, likeParam } from '../query';
import type {
    IMember,
    IMemberCreateInput,
    IMemberUpdateInput,
    IMemberListFilters,
    IMemberPagination,
} from '../../interfaces/IMember';
import { MemberStatus, EmploymentStatus, getMemberFullName } from '../../interfaces/IMember';
import { UserRole, UserStatus } from '../../interfaces/IUser';

// ─────────────────────────────────────────────────────────────────────────────
// Internal: normalise a DB row → IMember
// ─────────────────────────────────────────────────────────────────────────────
function parseMember(row: RowDataPacket): IMember {
    return {
        ...row,
        shareCapital: Number(row.shareCapital),
        monthlyNetSalary: Number(row.monthlyNetSalary),
    } as IMember;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page-able list of members for a given tenant.
 * Supports filtering by status and a text search across firstName,
 * lastName, memberNumber, and nationalId.
 */
export async function listMembers(
    tenantId: string,
    filters: IMemberListFilters = {},
    pagination: IMemberPagination = {}
): Promise<{ members: IMember[]; total: number }> {
    const page = Math.max(1, pagination.page ?? 1);
    const limit = Math.min(100, Math.max(1, pagination.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['m.tenantId = ?'];
    const params: unknown[] = [tenantId];

    if (filters.status) {
        conditions.push('m.status = ?');
        params.push(filters.status);
    }

    if (filters.search) {
        const like = likeParam(filters.search);
        conditions.push(
            '(m.firstName LIKE ? OR m.lastName LIKE ? OR m.memberNumber LIKE ? OR m.nationalId LIKE ?)'
        );
        params.push(like, like, like, like);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    // Count
    const countRow = await queryOne<RowDataPacket & { total: string }>(
        `SELECT COUNT(*) AS total FROM members m ${where}`,
        params
    );
    const total = parseInt(countRow?.total ?? '0', 10);

    // Data
    const rows = await query<RowDataPacket>(
        `SELECT m.* FROM members m ${where}
         ORDER BY m.createdAt DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return { members: rows.map(parseMember), total };
}

/**
 * Fetch a single member by UUID, scoped to a tenant.
 */
export async function getMemberById(id: string, tenantId: string): Promise<IMember | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM members WHERE id = ? AND tenantId = ? LIMIT 1',
        [id, tenantId]
    );
    return row ? parseMember(row) : null;
}

/**
 * Fetch member by memberNumber within a tenant.
 */
export async function getMemberByNumber(
    memberNumber: string,
    tenantId: string
): Promise<IMember | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM members WHERE memberNumber = ? AND tenantId = ? LIMIT 1',
        [memberNumber, tenantId]
    );
    return row ? parseMember(row) : null;
}

export interface IMemberProfile extends IMember {
    userEmail?: string;
    userFirebaseUid?: string;
    kycId?: string;
    kycStatus?: string;
    totalSavings?: number;
    totalLoanBalance?: number;
}

/**
 * Detailed member profile: joins users, kycs, aggregate savings & loans.
 */
export async function getMemberProfile(
    id: string,
    tenantId: string
): Promise<IMemberProfile | null> {
    const row = await queryOne<RowDataPacket>(
        `SELECT
             m.*,
             u.email          AS userEmail,
             u.firebaseUid    AS userFirebaseUid,
             k.id             AS kycId,
             CASE
                 WHEN k.id IS NULL THEN 'pending'
                 WHEN k.identityVerified = 1 AND k.residenceVerified = 1 AND k.incomeVerified = 1 THEN 'verified'
                 ELSE 'in_progress'
             END              AS kycStatus,
             COALESCE(SUM(DISTINCT ms.balance), 0) AS totalSavings,
             COALESCE(SUM(DISTINCT CASE WHEN l.status NOT IN ('settled','written_off') THEN l.outstandingBalance END), 0) AS totalLoanBalance
         FROM members m
         LEFT JOIN users u ON u.id = m.userId
         LEFT JOIN kyc k ON k.memberId = m.id
         LEFT JOIN member_savings ms ON ms.memberId = m.id
         LEFT JOIN loans l ON l.memberId = m.id
         WHERE m.id = ? AND m.tenantId = ?
         GROUP BY m.id, u.email, u.firebaseUid, k.id, k.identityVerified, k.residenceVerified, k.incomeVerified`,
        [id, tenantId]
    );

    if (!row) return null;
    return {
        ...parseMember(row),
        userEmail: row.userEmail ?? undefined,
        userFirebaseUid: row.userFirebaseUid ?? undefined,
        kycId: row.kycId ?? undefined,
        kycStatus: row.kycStatus ?? undefined,
        totalSavings: Number(row.totalSavings ?? 0),
        totalLoanBalance: Number(row.totalLoanBalance ?? 0),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Duplicate checks
// ─────────────────────────────────────────────────────────────────────────────

export interface DuplicateCheckResult {
    memberNumberExists: boolean;
    nationalIdExistsInTenant: boolean;
    /** If the nationalId exists in a different tenant, its name is returned here. */
    crossTenantSACCOSName?: string;
}

/**
 * Check for potential duplicate members before creation.
 * Returns flags that the caller can use to throw or add warnings.
 */
export async function checkDuplicate(
    memberNumber: string,
    nationalId: string,
    tenantId: string
): Promise<DuplicateCheckResult> {
    // Same tenant: memberNumber
    const numRow = await queryOne<RowDataPacket>(
        'SELECT id FROM members WHERE memberNumber = ? AND tenantId = ? LIMIT 1',
        [memberNumber, tenantId]
    );

    // Same tenant: nationalId
    const idRow = await queryOne<RowDataPacket>(
        'SELECT id FROM members WHERE nationalId = ? AND tenantId = ? LIMIT 1',
        [nationalId, tenantId]
    );

    // Cross-tenant: nationalId in a different tenant
    const crossRow = await queryOne<RowDataPacket & { tenantName?: string }>(
        `SELECT m.id, t.name AS tenantName
         FROM members m
         JOIN tenants t ON t.id = m.tenantId
         WHERE m.nationalId = ? AND m.tenantId != ?
         LIMIT 1`,
        [nationalId, tenantId]
    );

    return {
        memberNumberExists: numRow !== null,
        nationalIdExistsInTenant: idRow !== null,
        crossTenantSACCOSName: crossRow?.tenantName ?? undefined,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateMemberResult {
    member: IMember;
    userId: string;
    warning?: string;
}

/**
 * Atomically create a User row + a Member row in a single transaction.
 * Mirrors the logic in `app/api/admin/members/create/route.ts`.
 *
 * Firebase syncing is intentionally NOT done here — the API route layer owns
 * that side-effect so it can handle failures gracefully.
 */
export async function createMember(
    input: IMemberCreateInput,
    creatingUserTenantId: string
): Promise<CreateMemberResult> {
    return withTransaction(async (conn) => {
        // ── 1. Duplicate guard ──────────────────────────────────────────────
        const [numRows] = await conn.query<RowDataPacket[]>(
            'SELECT id FROM members WHERE (memberNumber = ? OR nationalId = ?) AND tenantId = ? LIMIT 1',
            [input.memberNumber, input.nationalId, creatingUserTenantId]
        );
        if (numRows.length > 0) {
            throw new Error(
                'Member with this Member Number or National ID already exists in your organisation'
            );
        }

        const [emailUserRows] = await conn.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ? LIMIT 1',
            [input.email]
        );
        if (emailUserRows.length > 0) {
            throw new Error('A user with this email already exists');
        }

        if (input.phone) {
            const [phoneUserRows] = await conn.query<RowDataPacket[]>(
                'SELECT id FROM users WHERE phone = ? LIMIT 1',
                [input.phone]
            );
            if (phoneUserRows.length > 0) {
                throw new Error('A user with this phone number already exists');
            }
        }

        // ── 2. Cross-tenant membership warning ──────────────────────────────
        const [crossRows] = await conn.query<RowDataPacket[]>(
            `SELECT m.id, t.name AS tenantName
             FROM members m
             JOIN tenants t ON t.id = m.tenantId
             WHERE m.nationalId = ? AND m.tenantId != ?
             LIMIT 1`,
            [input.nationalId, creatingUserTenantId]
        );
        const warning =
            crossRows.length > 0
                ? `Applicant is already an active member of ${(crossRows[0] as any).tenantName}. ` +
                `Written consent from the Director for Co-operative Development is required for dual membership.`
                : undefined;

        // ── 3. Insert User ──────────────────────────────────────────────────
        const userId = uuidv4();
        const defaultPermissions: Record<string, boolean> = {};
        await conn.execute(
            `INSERT INTO users (
                id, email, firstName, lastName, role, status,
                phone, tenantId, mfaEnabled, mustChangePassword,
                permissions, createdAt, updatedAt
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, NOW(), NOW())`,
            [
                userId,
                input.email,
                input.firstName,
                input.lastName,
                UserRole.MEMBER,
                UserStatus.ACTIVE,
                input.phone ?? null,
                creatingUserTenantId,
                JSON.stringify(defaultPermissions),
            ]
        );

        // ── 4. Insert Member ────────────────────────────────────────────────
        const memberId = uuidv4();
        await conn.execute(
            `INSERT INTO members (
                id, userId, tenantId, memberNumber, firstName, lastName, middleName,
                nationalId, passportNumber, dateOfBirth, gender, email, phone,
                physicalAddress, postalAddress, status, employmentStatus, employer,
                employeeNumber, shareCapital, monthlyNetSalary, joinDate,
                createdAt, updatedAt
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                memberId,
                userId,
                creatingUserTenantId,
                input.memberNumber,
                input.firstName,
                input.lastName,
                input.middleName ?? null,
                input.nationalId,
                input.passportNumber ?? null,
                input.dateOfBirth,
                input.gender,
                input.email,
                input.phone ?? null,
                input.physicalAddress ?? null,
                input.postalAddress ?? null,
                input.status ?? MemberStatus.ACTIVE,
                input.employmentStatus,
                input.employer ?? null,
                input.employeeNumber ?? null,
                input.shareCapital ?? 0,
                input.monthlyNetSalary ?? 0,
                input.joinDate,
            ]
        );

        // ── 5. Return freshly-inserted member ──────────────────────────────
        const [memberRows] = await conn.query<RowDataPacket[]>(
            'SELECT * FROM members WHERE id = ? LIMIT 1',
            [memberId]
        );
        const member = parseMember(memberRows[0] as RowDataPacket);

        return { member, userId, warning };
    });
}

/**
 * Update allowed fields on a member record.
 */
export async function updateMember(
    id: string,
    tenantId: string,
    data: IMemberUpdateInput
): Promise<IMember> {
    const { clause, values } = buildSetClause(data as Record<string, unknown>);
    await execute(
        `UPDATE members SET ${clause}, updatedAt = NOW() WHERE id = ? AND tenantId = ?`,
        [...values, id, tenantId]
    );
    const updated = await getMemberById(id, tenantId);
    if (!updated) throw new Error(`Member ${id} not found after update`);
    return updated;
}

/**
 * Change the status of a single member (active, suspended, resigned, etc.)
 */
export async function updateMemberStatus(
    id: string,
    tenantId: string,
    status: MemberStatus,
    exitReason?: string
): Promise<IMember> {
    const isExit = [
        MemberStatus.RESIGNED,
        MemberStatus.RETIRED,
        MemberStatus.DECEASED,
        MemberStatus.INACTIVE,
    ].includes(status);

    await execute(
        `UPDATE members
         SET status = ?,
             exitReason = ?,
             exitDate = ?,
             updatedAt = NOW()
         WHERE id = ? AND tenantId = ?`,
        [
            status,
            exitReason ?? null,
            isExit ? new Date().toISOString().slice(0, 10) : null,
            id,
            tenantId,
        ]
    );

    const updated = await getMemberById(id, tenantId);
    if (!updated) throw new Error(`Member ${id} not found after status update`);
    return updated;
}

/**
 * Bulk-update the status of multiple members within the same tenant.
 * Returns the number of rows affected.
 */
export async function bulkUpdateMemberStatus(
    ids: string[],
    tenantId: string,
    status: MemberStatus
): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(', ');
    const result = await execute(
        `UPDATE members
         SET status = ?, updatedAt = NOW()
         WHERE id IN (${placeholders}) AND tenantId = ?`,
        [status, ...ids, tenantId]
    );
    return result.affectedRows;
}

/**
 * Full export query – returns all member rows for a tenant without pagination.
 * Intended for CSV export endpoints.
 */
export async function exportMembers(tenantId: string): Promise<IMember[]> {
    const rows = await query<RowDataPacket>(
        `SELECT * FROM members WHERE tenantId = ? ORDER BY memberNumber ASC`,
        [tenantId]
    );
    return rows.map(parseMember);
}

// Re-export enums for convenience
export { MemberStatus, EmploymentStatus, getMemberFullName };
