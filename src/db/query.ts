/**
 * src/db/query.ts
 *
 * Typed wrappers around the mysql2 pool for use by all SQL services.
 *
 *  query<T>()       – returns rows as T[]
 *  queryOne<T>()    – returns first row as T | null
 *  execute()        – INSERT / UPDATE / DELETE, returns ResultSetHeader
 *  withTransaction()– acquires connection, runs callback, commits / rolls back
 */

import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { getPool } from './pool';

// ─────────────────────────────────────────────────────────────────────────────
// SELECT helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a SELECT query and return all rows typed as T.
 */
export async function query<T extends RowDataPacket>(
    sql: string,
    params?: any[]
): Promise<T[]> {
    const pool = getPool();
    const [rows] = await pool.query<T[]>(sql, params || []);
    return rows;
}

/**
 * Run a SELECT query and return only the first row, or null.
 */
export async function queryOne<T extends RowDataPacket>(
    sql: string,
    params?: any[]
): Promise<T | null> {
    const rows = await query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutation helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run an INSERT / UPDATE / DELETE statement.
 * Returns the full ResultSetHeader so callers can inspect insertId, affectedRows, etc.
 */
export async function execute(
    sql: string,
    params?: any[]
): Promise<ResultSetHeader> {
    const pool = getPool();
    const [result] = await pool.execute<ResultSetHeader>(sql, params || []);
    return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Transaction helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run a series of operations inside a database transaction.
 *
 * The callback receives the active connection so it can issue queries within
 * the same transaction using `conn.query()` / `conn.execute()`.
 * Rolls back automatically on any thrown error, then re-throws.
 */
export async function withTransaction<T>(
    fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
    const pool = getPool();
    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
        const result = await fn(conn);
        await conn.commit();
        return result;
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SQL building utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a SET clause from a partial object, skipping undefined values.
 * Returns { clause: "col1 = ?, col2 = ?", values: [...] }
 */
export function buildSetClause(
    data: Record<string, unknown>,
    exclude: string[] = []
): { clause: string; values: unknown[] } {
    const entries = Object.entries(data).filter(
        ([k, v]) => v !== undefined && !exclude.includes(k)
    );

    if (entries.length === 0) {
        throw new Error('No updatable fields provided');
    }

    const clause = entries.map(([k]) => `\`${k}\` = ?`).join(', ');
    const values = entries.map(([, v]) =>
        typeof v === 'object' && v !== null && !(v instanceof Date)
            ? JSON.stringify(v)
            : v
    );

    return { clause, values };
}

/**
 * Escapes a value for use in a LIKE clause (adds surrounding %).
 */
export function likeParam(value: string): string {
    return `%${value.replace(/[%_\\]/g, '\\$&')}%`;
}
