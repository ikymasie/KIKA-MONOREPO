import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';

async function runSql() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        const queryRunner = AppDataSource.createQueryRunner();
        console.log('Adding notificationPreferences column to users table...');
        await queryRunner.query("ALTER TABLE users ADD COLUMN notificationPreferences JSON NULL AFTER permissions;");
        console.log('✅ notificationPreferences column added successfully');
        await AppDataSource.destroy();
    } catch (error: any) {
        if (error.message.includes('Duplicate column name')) {
            console.log('✅ notificationPreferences column already exists');
        } else {
            console.error('❌ Error adding column:', error);
        }
        process.exit(0); // Exit gracefully even if it exists
    }
}
runSql();
