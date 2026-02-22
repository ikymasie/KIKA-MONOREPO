#!/usr/bin/env ts-node
/**
 * KIKA — Firebase Auth Provisioner
 * 
 * For every user in the `users` table:
 *   1. Check if Firebase Auth account exists for that email
 *   2. If not, create one with password "123456"
 *   3. Update the DB record with the Firebase UID
 * 
 * Also runs for member accounts in the `members` table (via their userId link
 * or by creating a matching Firebase user from the member's email).
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/provision-firebase-users.ts
 */

import * as admin from 'firebase-admin';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// ─── Firebase init ────────────────────────────────────────────────────────────
const serviceAccountPath = path.resolve(__dirname, '../service-account-key.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const auth = admin.auth();

// ─── DB config ────────────────────────────────────────────────────────────────
const DB: mysql.ConnectionOptions = {
    host: process.env.DATABASE_HOST || '34.63.62.50',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USERNAME || 'kika-admin',
    password: process.env.DATABASE_PASSWORD || 'Kika@2026',
    database: process.env.DATABASE_NAME || 'kikadb',
    ssl: { rejectUnauthorized: false },
};

const PASSWORD = '123456';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getOrCreateFirebaseUser(
    email: string,
    displayName: string
): Promise<{ uid: string; created: boolean }> {
    // 1. Try to get existing user
    try {
        const existing = await auth.getUserByEmail(email);
        return { uid: existing.uid, created: false };
    } catch (err: any) {
        if (err.code !== 'auth/user-not-found') throw err;
    }

    // 2. Create new user
    const user = await auth.createUser({
        email,
        password: PASSWORD,
        displayName,
        emailVerified: true,
    });
    return { uid: user.uid, created: true };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n🔑  KIKA Firebase Auth Provisioner\n');
    const conn = await mysql.createConnection(DB);

    let created = 0, existing = 0, skipped = 0, errors = 0;

    try {
        // ── 1. Staff Users ─────────────────────────────────────────────────────
        console.log('👥  Processing staff users…');
        const [staffRows] = await conn.execute<mysql.RowDataPacket[]>(
            `SELECT id, email, firstName, lastName, firebaseUid FROM users WHERE email IS NOT NULL AND email != ''`
        );

        for (const row of staffRows) {
            const email: string = row.email;
            const name = `${row.firstName} ${row.lastName}`;

            if (!email) { skipped++; continue; }

            try {
                const { uid, created: wasCreated } = await getOrCreateFirebaseUser(email, name);

                // Update DB if UID missing or different
                if (row.firebaseUid !== uid) {
                    await conn.execute(
                        `UPDATE users SET firebaseUid = ? WHERE id = ?`,
                        [uid, row.id]
                    );
                }

                if (wasCreated) {
                    created++;
                    console.log(`  ✅  [NEW]      ${email}`);
                } else {
                    existing++;
                    console.log(`  🔵  [EXISTS]   ${email}`);
                }
            } catch (err: any) {
                errors++;
                console.error(`  ❌  [ERROR]    ${email} — ${err.message}`);
            }
        }

        // ── 2. Member Accounts ─────────────────────────────────────────────────
        console.log('\n👤  Processing member accounts…');
        const [memberRows] = await conn.execute<mysql.RowDataPacket[]>(
            `SELECT m.id, m.email, m.firstName, m.lastName, m.userId,
              u.firebaseUid as existingUid
       FROM members m
       LEFT JOIN users u ON u.id = m.userId
       WHERE m.email IS NOT NULL AND m.email != ''`
        );

        for (const row of memberRows) {
            const email: string = row.email;
            const name = `${row.firstName} ${row.lastName}`;

            if (!email) { skipped++; continue; }

            try {
                const { uid, created: wasCreated } = await getOrCreateFirebaseUser(email, name);

                // If member has no linked user record, create one
                if (!row.userId) {
                    // Check if user already exists in users table for this firebase uid
                    const [existing2] = await conn.execute<mysql.RowDataPacket[]>(
                        `SELECT id FROM users WHERE firebaseUid = ? OR email = ?`,
                        [uid, email]
                    );

                    let userId: string;
                    if (existing2.length > 0) {
                        userId = existing2[0].id;
                    } else {
                        // Insert a minimal user record for this member
                        const { v4: uuidv4 } = await import('uuid');
                        userId = uuidv4();
                        const now = new Date().toISOString().replace('T', ' ').split('.')[0];
                        await conn.execute(
                            `INSERT INTO users (id, email, firebaseUid, firstName, lastName, role, status, mfaEnabled, mustChangePassword, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, 'member', 'active', 0, 0, ?, ?)`,
                            [userId, email, uid, row.firstName, row.lastName, now, now]
                        );
                    }

                    // Link member → user
                    await conn.execute(
                        `UPDATE members SET userId = ? WHERE id = ?`,
                        [userId, row.id]
                    );
                } else {
                    // Just update the UID on the linked user record
                    await conn.execute(
                        `UPDATE users SET firebaseUid = ? WHERE id = ?`,
                        [uid, row.userId]
                    );
                }

                if (wasCreated) {
                    created++;
                    console.log(`  ✅  [NEW]      ${email}`);
                } else {
                    existing++;
                    console.log(`  🔵  [EXISTS]   ${email}`);
                }
            } catch (err: any) {
                errors++;
                console.error(`  ❌  [ERROR]    ${email} — ${err.message}`);
            }
        }

    } finally {
        await conn.end();
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(55)}`);
    console.log(`  ✅  Created  : ${created}`);
    console.log(`  🔵  Existing : ${existing}`);
    console.log(`  ⚠️   Skipped  : ${skipped}`);
    console.log(`  ❌  Errors   : ${errors}`);
    console.log(`${'─'.repeat(55)}\n`);
    console.log(`  Password for all new accounts: "${PASSWORD}"\n`);
}

run().catch(err => {
    console.error('\n❌  Fatal error:', err);
    process.exit(1);
});
