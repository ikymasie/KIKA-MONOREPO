/**
 * src/db/services/UserService.ts
 *
 * All database operations for the `users` table, using raw parameterized SQL.
 * Mirrors every TypeORM repository call in the existing API routes.
 */

import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { query, queryOne, execute, buildSetClause } from '../query';
import type { IUser, IUserCreateInput, IUserUpdateInput } from '../../interfaces/IUser';
import { UserRole, UserStatus, isTenantAdmin } from '../../interfaces/IUser';

// ─────────────────────────────────────────────────────────────────────────────
// Internal: parse JSON columns
// ─────────────────────────────────────────────────────────────────────────────
function parseUser(row: RowDataPacket): IUser {
    const parseJson = (v: unknown) =>
        typeof v === 'string' ? JSON.parse(v) : v;

    return {
        ...row,
        permissions: row.permissions ? parseJson(row.permissions) : undefined,
        notificationPreferences: row.notificationPreferences
            ? parseJson(row.notificationPreferences)
            : undefined,
        mfaEnabled: Boolean(row.mfaEnabled),
        mustChangePassword: Boolean(row.mustChangePassword),
    } as IUser;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserById(id: string): Promise<IUser | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM users WHERE id = ? LIMIT 1',
        [id]
    );
    return row ? parseUser(row) : null;
}

export async function getUserByEmail(email: string): Promise<IUser | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM users WHERE email = ? LIMIT 1',
        [email]
    );
    return row ? parseUser(row) : null;
}

export async function getUserByFirebaseUid(uid: string): Promise<IUser | null> {
    const row = await queryOne<RowDataPacket>(
        'SELECT * FROM users WHERE firebaseUid = ? LIMIT 1',
        [uid]
    );
    return row ? parseUser(row) : null;
}

export async function listUsersByTenant(tenantId: string): Promise<IUser[]> {
    const rows = await query<RowDataPacket>(
        'SELECT * FROM users WHERE tenantId = ? ORDER BY createdAt DESC',
        [tenantId]
    );
    return rows.map(parseUser);
}

/**
 * Check whether an email address is taken (globally, across all tenants).
 */
export async function emailExists(email: string): Promise<boolean> {
    const row = await queryOne<RowDataPacket>(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
    );
    return row !== null;
}

/**
 * Check whether a phone number is taken (globally).
 */
export async function phoneExists(phone: string): Promise<boolean> {
    const row = await queryOne<RowDataPacket>(
        'SELECT id FROM users WHERE phone = ? LIMIT 1',
        [phone]
    );
    return row !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns default permission map per role.
 */
function getDefaultPermissions(role: UserRole): Record<string, boolean> {
    switch (role) {
        case UserRole.SACCOS_ADMIN:
            return {
                'system:manage': false,
                'users:manage': true,
                'members:manage': true,
                'loans:manage': true,
                'savings:manage': true,
                'reports:view': true,
                'settings:manage': true,
            };
        case UserRole.LOAN_OFFICER:
            return { 'members:view': true, 'loans:manage': true, 'guarantors:manage': true };
        case UserRole.ACCOUNTANT:
            return { 'finance:manage': true, 'gl:manage': true, 'payments:manage': true, 'reports:view': true };
        case UserRole.MEMBER_SERVICE_REP:
            return { 'members:manage': true, 'kyc:update': true, 'insurance_claims:initiate': true };
        case UserRole.CREDIT_COMMITTEE:
            return { 'loans:view': true, 'loans:approve': true };
        case UserRole.MEMBER:
            return {};
        default:
            return {};
    }
}

/**
 * Insert a new user row. Generates a UUID if none is provided.
 * Returns the full newly-created user record.
 */
export async function createUser(data: IUserCreateInput): Promise<IUser> {
    const id = uuidv4();
    const permissions = data.permissions ?? getDefaultPermissions(data.role);
    const status = data.status ?? UserStatus.ACTIVE;
    const mfaEnabled = data.mfaEnabled ?? false;
    const mustChangePassword = data.mustChangePassword ?? false;

    await execute(
        `INSERT INTO users (
            id, email, firstName, lastName, role, status, phone,
            tenantId, mfaEnabled, mustChangePassword, passwordHash, permissions,
            notificationPreferences, createdAt, updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id,
            data.email,
            data.firstName,
            data.lastName,
            data.role,
            status,
            data.phone ?? null,
            data.tenantId ?? null,
            mfaEnabled ? 1 : 0,
            mustChangePassword ? 1 : 0,
            data.passwordHash ?? null,
            JSON.stringify(permissions),
            data.notificationPreferences ? JSON.stringify(data.notificationPreferences) : null,
        ]
    );

    const created = await getUserById(id);
    if (!created) throw new Error('User creation failed: record not found after insert');
    return created;
}

/**
 * Partial update of a user row. Only provided (non-undefined) fields are changed.
 */
export async function updateUser(id: string, data: IUserUpdateInput): Promise<IUser> {
    const serialized: Record<string, unknown> = { ...data };
    for (const col of ['permissions', 'notificationPreferences'] as const) {
        if (serialized[col] !== undefined && typeof serialized[col] === 'object') {
            serialized[col] = JSON.stringify(serialized[col]);
        }
    }
    if ('mfaEnabled' in serialized && serialized.mfaEnabled !== undefined) {
        serialized.mfaEnabled = serialized.mfaEnabled ? 1 : 0;
    }
    if ('mustChangePassword' in serialized && serialized.mustChangePassword !== undefined) {
        serialized.mustChangePassword = serialized.mustChangePassword ? 1 : 0;
    }

    const { clause, values } = buildSetClause(serialized);
    await execute(`UPDATE users SET ${clause}, updatedAt = NOW() WHERE id = ?`, [...values, id]);

    const updated = await getUserById(id);
    if (!updated) throw new Error(`User ${id} not found after update`);
    return updated;
}

/**
 * Stamp the lastLoginAt timestamp for the given user.
 */
export async function updateLastLogin(id: string): Promise<void> {
    await execute('UPDATE users SET lastLoginAt = NOW(), updatedAt = NOW() WHERE id = ?', [id]);
}

/**
 * Bind a Firebase UID to an existing user.
 */
export async function setFirebaseUid(id: string, firebaseUid: string): Promise<void> {
    await execute(
        'UPDATE users SET firebaseUid = ?, updatedAt = NOW() WHERE id = ?',
        [firebaseUid, id]
    );
}

// Re-export enums and helpers for consumers that import only from this service
export { UserRole, UserStatus, isTenantAdmin, getDefaultPermissions };
