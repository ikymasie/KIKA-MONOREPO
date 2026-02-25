const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        ssl: { rejectUnauthorized: false }
    });
    const [rows] = await conn.execute('SELECT passwordHash FROM users WHERE email = ?', ['admin@kika.bw']);
    await conn.end();
    if (!rows[0]) { console.log('User not found'); return; }
    const hash = rows[0].passwordHash;
    console.log('Stored hash:', hash);
    const candidates = ['password123', 'Admin@2024', 'Kika@2026', 'admin123', 'Admin123', 'kika@2026'];
    for (const p of candidates) {
        const match = await bcrypt.compare(p, hash);
        console.log('Matches', JSON.stringify(p) + ':', match);
    }
})();
