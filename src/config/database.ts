import 'dotenv/config';
import { getPool, closePool } from '../db/pool';

/**
 * src/config/database.ts
 * 
 * This file has been refactored to remove TypeORM. It now serves as a 
 * compatibility layer for legacy scripts, providing access to the 
 * underlying mysql2 connection pool.
 */

// Stub for TypeORM DataSource to prevent crashing legacy imports
export const AppDataSource = {
    initialize: async () => {
        getPool();
        console.log('✅ Database (pool) initialized via legacy stub');
        return AppDataSource;
    },
    destroy: async () => {
        await closePool();
        console.log('Database (pool) closed via legacy stub');
    },
    isInitialized: true,
    // Add other stubs if necessary, but ideally refactor callers
    getRepository: (entity: any) => {
        throw new Error(`TypeORM getRepository is no longer supported. Please refactor to use raw SQL with src/db/query.ts.`);
    }
} as any;

export async function getDataSource() {
    return AppDataSource.initialize();
}

export async function closeDataSource() {
    return AppDataSource.destroy();
}
