import { AppDataSource } from './src/config/database';

async function testConnection() {
    try {
        console.log('Connecting to database...');
        await AppDataSource.initialize();
        console.log('✅ Connection successful!');

        const tables = await AppDataSource.query('SHOW TABLES');
        console.log('Tables in database:', tables);

        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    }
}

testConnection();
