import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';

async function sync() {
    try {
        console.log('Initializing database connection...');
        await AppDataSource.initialize();
        console.log('Database connected successfully');

        console.log('Synchronizing database schema...');
        // We use synchronize(false) first to check, but we need to push changes
        await AppDataSource.synchronize();
        console.log('✅ Database schema synchronized successfully');

        await AppDataSource.destroy();
    } catch (error) {
        console.error('Error during schema synchronization:', error);
        process.exit(1);
    }
}

sync();
