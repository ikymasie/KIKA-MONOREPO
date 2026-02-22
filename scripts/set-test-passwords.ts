#!/usr/bin/env ts-node
/**
 * Set test passwords for all seeded Firebase Auth users.
 * Reads firebaseUid from MySQL, then updates password via Firebase Admin SDK.
 * Processes sequentially with delay to respect Firebase quota limits.
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/set-test-passwords.ts
 */

import * as admin from 'firebase-admin';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const TEST_PASSWORD = 'Kika@2026';
const DELAY_MS = 200; // 5 req/sec to stay under quota

// Init Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS!);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const DB: mysql.ConnectionOptions = {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: { rejectUnauthorized: false },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    const startAtIndex = parseInt(process.argv[2] || '0', 10);
    console.log(`🔑  Setting test passwords (starting at index ${startAtIndex})…\n`);

    const conn = await mysql.createConnection(DB);

    try {
        // Fetch all users with a firebaseUid, prioritise admin roles first
        const [rows] = await conn.execute(`
            SELECT id, email, role, firebaseUid FROM users
            WHERE firebaseUid IS NOT NULL
            ORDER BY
                CASE role
                    WHEN 'saccos_admin' THEN 1
                    WHEN 'loan_officer' THEN 2
                    WHEN 'accountant' THEN 3
                    WHEN 'member_service_rep' THEN 4
                    WHEN 'credit_committee' THEN 5
                    WHEN 'dcd_director' THEN 6
                    WHEN 'dcd_field_officer' THEN 7
                    WHEN 'dcd_compliance_officer' THEN 8
                    WHEN 'bob_prudential_supervisor' THEN 9
                    WHEN 'deduction_officer' THEN 10
                    WHEN 'registrar' THEN 11
                    WHEN 'registry_clerk' THEN 12
                    WHEN 'legal_officer' THEN 13
                    ELSE 99
                END,
                email
        `);
        const users = rows as { id: string; email: string; role: string; firebaseUid: string }[];

        console.log(`Found ${users.length} users total. Processing from index ${startAtIndex}…\n`);

        let success = 0;
        let failed = 0;
        let skipped = startAtIndex;

        for (let i = startAtIndex; i < users.length; i++) {
            const user = users[i];
            try {
                await admin.auth().updateUser(user.firebaseUid, {
                    password: TEST_PASSWORD,
                    emailVerified: true,
                });
                success++;
                if ((success + skipped) % 25 === 0 || success <= 5) {
                    console.log(`  [${i + 1}/${users.length}] ✓ ${user.role.padEnd(28)} ${user.email}`);
                }
            } catch (err: any) {
                if (err.code === 'auth/user-not-found') {
                    console.warn(`  [${i + 1}] ⚠ Not in Firebase: ${user.email}`);
                } else if (err.code === 'auth/quota-exceeded' || err.message?.includes('quota')) {
                    console.error(`\n  ⚠ Quota hit at index ${i}. Re-run with: npx ts-node --project tsconfig.scripts.json scripts/set-test-passwords.ts ${i}`);
                    break;
                } else {
                    console.error(`  [${i + 1}] ✗ ${user.email}: ${err.message}`);
                }
                failed++;
            }
            await sleep(DELAY_MS);
        }

        console.log(`\n✅  Done! ${success} updated, ${failed} skipped/failed`);
        console.log(`\n🔐  Test credentials:`);
        console.log(`   Password: ${TEST_PASSWORD}`);
        console.log(`\n📋  Sample emails per role:`);

        const roles: Record<string, string> = {};
        for (const u of users) {
            if (!roles[u.role]) roles[u.role] = u.email;
        }

        const roleOrder = [
            'saccos_admin', 'loan_officer', 'accountant', 'member_service_rep',
            'credit_committee', 'dcd_director', 'dcd_field_officer', 'dcd_compliance_officer',
            'bob_prudential_supervisor', 'deduction_officer', 'registrar', 'registry_clerk',
            'legal_officer', 'member'
        ];

        for (const role of roleOrder) {
            if (roles[role]) {
                console.log(`   ${role.padEnd(30)} ${roles[role]}`);
            }
        }

    } finally {
        await conn.end();
    }
}

main().catch((err) => {
    console.error('❌  Script failed:', err);
    process.exit(1);
});
