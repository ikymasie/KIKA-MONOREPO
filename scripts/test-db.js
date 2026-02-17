#!/usr/bin/env node
require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
    let connection;
    try {
        console.log('🔌 Attempting to connect to MySQL...');
        console.log(`   Host: ${process.env.DATABASE_HOST}`);
        console.log(`   Database: ${process.env.DATABASE_NAME}`);
        console.log(`   User: ${process.env.DATABASE_USERNAME}`);
        console.log('');

        connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            port: process.env.DATABASE_PORT || 3306,
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        });

        console.log('✅ Successfully connected to MySQL!');

        // Test query
        const [versionRows] = await connection.query('SELECT VERSION() as version');
        console.log('📊 MySQL Version:', versionRows[0].version);

        // Check if tables exist
        const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [process.env.DATABASE_NAME]);

        console.log('');
        console.log(`📋 Found ${tables.length} tables in database:`);
        if (tables.length > 0) {
            tables.forEach(row => {
                console.log(`   - ${row.table_name || row.TABLE_NAME}`);
            });
        } else {
            console.log('   (No tables yet - they will be created when you access the app)');
        }

        await connection.end();
        console.log('');
        console.log('✅ Database connection test completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed!');
        console.error('Error:', error.message);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Check if MySQL is running');
        console.error('2. Verify credentials in .env file');
        console.error('3. Check firewall/network settings (port 3306)');
        console.error('4. Ensure database exists');
        if (connection) await connection.end();
        process.exit(1);
    }
}

testConnection();
