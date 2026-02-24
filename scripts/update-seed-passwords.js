const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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
        console.log("Bulk updating all users with default password 'password123'...");
        const hash = bcrypt.hashSync('password123', 10);

        const [result] = await connection.execute(
            "UPDATE users SET passwordHash = ? WHERE passwordHash IS NULL OR passwordHash = ''",
            [hash]
        );

        console.log(`Successfully updated ${result.affectedRows} users.`);
    } catch (error) {
        console.error("Error bulk updating users:", error);
    } finally {
        await connection.end();
    }
}
run();
