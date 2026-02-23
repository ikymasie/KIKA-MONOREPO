/**
 * src/db/pool.ts
 *
 * Singleton mysql2 connection pool. All SQL services consume this pool via
 * getPool(). Uses the same env vars as the TypeORM DataSource so no additional
 * configuration is needed.
 */

import mysql from 'mysql2/promise';

let _pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
    if (_pool) return _pool;

    _pool = mysql.createPool({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306', 10),
        user: process.env.DATABASE_USERNAME || 'kika-admin',
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME || 'kikadb',
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0,
        connectTimeout: 10000,
        timezone: '+00:00',
        // Ensure JSON columns come back as objects, dates as strings
        decimalNumbers: true,
    });

    return _pool;
}

/** Tear down the pool (test / graceful shutdown). */
export async function closePool(): Promise<void> {
    if (_pool) {
        await _pool.end();
        _pool = null;
    }
}
