const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("Checking if passwordHash column exists...");
        const [columns] = await connection.execute("SHOW COLUMNS FROM users LIKE 'passwordHash'");

        if (columns.length === 0) {
            console.log("Adding passwordHash column to users table...");
            await connection.execute("ALTER TABLE users ADD COLUMN passwordHash VARCHAR(255) NULL AFTER firebaseUid");
        }

        const email = 'admin@kika.bw';
        const [rows] = await connection.execute("SELECT id FROM users WHERE email = ?", [email]);

        if (rows.length === 0) {
            console.log(`Creating user ${email}...`);
            const id = uuidv4();
            const password = 'password123';
            const hash = bcrypt.hashSync(password, 10);

            // Try to find a valid tenantId
            const [tenants] = await connection.execute("SELECT id FROM tenants LIMIT 1");
            const tenantId = tenants.length > 0 ? tenants[0].id : null;

            await connection.execute(
                "INSERT INTO users (id, email, passwordHash, firstName, lastName, role, status, tenantId, mfaEnabled, mustChangePassword) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [id, email, hash, 'Kika', 'Admin', 'saccos_admin', 'active', tenantId, 0, 0]
            );
            console.log(`User ${email} created successfully with ID: ${id}`);
        } else {
            console.log(`User ${email} already exists. Updating password...`);
            const hash = bcrypt.hashSync('password123', 10);
            await connection.execute(
                "UPDATE users SET passwordHash = ?, status = 'active' WHERE email = ?",
                [hash, email]
            );
            console.log("User updated successfully.");
        }

    } catch (error) {
        console.error("Error updating database:", error);
    } finally {
        await connection.end();
    }
}
run();
