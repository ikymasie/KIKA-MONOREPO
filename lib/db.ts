import { AppDataSource } from '@/src/config/database';

let dataSource: typeof AppDataSource | null = null;

export async function getDb() {
    if (!dataSource) {
        dataSource = await AppDataSource.initialize();
    }
    return dataSource;
}

export { AppDataSource };
