/**
 * @deprecated TypeORM has been removed. Use raw SQL via @/src/db/query instead.
 * This file is kept as a compatibility stub so any remaining indirect imports don't break.
 */
import { getPool } from '@/src/db/pool';

export async function getDb() {
    return getPool();
}

// Stub for any code that still imports AppDataSource
export const AppDataSource = null;
