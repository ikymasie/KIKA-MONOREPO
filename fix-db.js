const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
    console.log("Connecting to the database...");
    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '3306'),
        user: process.env.DATABASE_USERNAME || 'kika-admin',
        password: process.env.DATABASE_PASSWORD || 'Kika@2026',
        database: process.env.DATABASE_NAME || 'kikadb',
        ssl: { rejectUnauthorized: false }
    });

    console.log("Connected successfully.");

    // Find orphaned certificates
    const [rows] = await connection.execute(`
        SELECT c.id, c.tenantId 
        FROM certificates c 
        LEFT JOIN tenants t ON c.tenantId = t.id 
        WHERE t.id IS NULL
    `);

    console.log(`Orphaned certificates found: ${rows.length}`);
    if (rows.length > 0) {
        console.log(rows);
        console.log("Deleting orphaned certificates...");
        const [result] = await connection.execute(`
            DELETE c 
            FROM certificates c 
            LEFT JOIN tenants t ON c.tenantId = t.id 
            WHERE t.id IS NULL
        `);
        console.log(`Deleted ${result.affectedRows} orphaned certificates.`);
    }

    // Now look for certificates pointing to invalid users
    const [userRows] = await connection.execute(`
        SELECT c.id, c.issuedBy 
        FROM certificates c 
        LEFT JOIN users u ON c.issuedBy = u.id 
        WHERE c.issuedBy IS NOT NULL AND u.id IS NULL
    `);

    console.log(`Certificates with invalid issuer found: ${userRows.length}`);
    if (userRows.length > 0) {
        console.log(userRows);
        console.log("Setting invalid issuer to NULL...");
        const [result] = await connection.execute(`
            UPDATE certificates c
            LEFT JOIN users u ON c.issuedBy = u.id
            SET c.issuedBy = NULL
            WHERE c.issuedBy IS NOT NULL AND u.id IS NULL
        `);
        console.log(`Updated ${result.affectedRows} certificates.`);
    }

    await connection.end();
}

fix().catch(console.error);
