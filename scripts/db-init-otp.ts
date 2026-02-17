import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function main() {
    console.log('🚀 Initializing OTP database table and indexes...');

    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    try {
        // 1. Create OTPS table
        console.log('Creating otps table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS otps (
                id CHAR(36) NOT NULL PRIMARY KEY,
                phone VARCHAR(255) NOT NULL,
                code VARCHAR(255) NOT NULL,
                expiresAt TIMESTAMP NOT NULL,
                used BOOLEAN NOT NULL DEFAULT 0,
                createdAt TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                INDEX (phone)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Add indexes to users and members (ignoring errors if they already exist)
        console.log('Adding indexes to users and members...');
        try {
            await connection.execute('CREATE INDEX idx_users_phone ON users(phone)');
            console.log('✅ Added index to users(phone)');
        } catch (e: any) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️ Index idx_users_phone already exists');
            } else {
                console.warn('⚠️ Could not add index to users:', e.message);
            }
        }

        try {
            await connection.execute('CREATE INDEX idx_members_phone ON members(phone)');
            console.log('✅ Added index to members(phone)');
        } catch (e: any) {
            if (e.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️ Index idx_members_phone already exists');
            } else {
                console.warn('⚠️ Could not add index to members:', e.message);
            }
        }

        console.log('✨ Database initialization complete!');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        await connection.end();
    }
}

main();
