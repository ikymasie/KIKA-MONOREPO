const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT),
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        const [guarantors] = await conn.execute(
            `SELECT lg.*, m.id AS gmId, m.memberNumber AS gmNumber, m.firstName AS gmFirst, m.lastName AS gmLast
             FROM loan_guarantors lg LEFT JOIN members m ON m.id = lg.guarantorMemberId
             WHERE lg.loanId = ?`,
            ["097724cb-6168-4bba-acc2-c38adf5e4744"]
        );
        console.log("Guarantors success:");
    } catch(e) {
        console.error("Guarantors error:", e.message);
    }
    
    try {
        const [members] = await conn.execute('SELECT id, memberNumber, firstName, lastName, email, phone, nationalId, employer FROM members LIMIT 1');
        console.log("Members success");
    } catch(e) {
        console.error("Members error:", e.message);
    }
    
    try {
        const [products] = await conn.execute('SELECT id, name, code, interestRate, savingsMultiplier FROM loan_products LIMIT 1');
        console.log("Products success");
    } catch(e) {
        console.error("Products error:", e.message);
    }

    try {
        const [loans] = await conn.execute('SELECT * FROM loans WHERE id = ?', ["097724cb-6168-4bba-acc2-c38adf5e4744"]);
        console.log("Loans success, loan exists?", loans.length > 0);
    } catch(e) {
        console.error("Loans error:", e.message);
    }

    await conn.end();
}
run();
