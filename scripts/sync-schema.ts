import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';

async function syncSchema() {
    try {
        console.log('🔄 Initializing database for schema sync...');
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        console.log('⌛ Synchronizing schema...');
        await AppDataSource.synchronize();
        console.log('✅ Schema synchronization complete!');

    } catch (error) {
        console.error('❌ Schema sync failed:', error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

syncSchema();
