const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USERNAME || 'kika-admin',
        password: process.env.DATABASE_PASSWORD || 'Kika@2026',
        database: process.env.DATABASE_NAME || 'kikadb',
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await connection.execute('ALTER TABLE `certificates` ADD CONSTRAINT `FK_b55eec2457437300851bbb30712` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION');
        console.log("Constraint added successfully.");
    } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') {
            console.log("Constraint already exists or duplicate key name.");
        } else {
            console.error("Constraint failed:", e.message);
        }
    }

    await connection.end();
}
test();
