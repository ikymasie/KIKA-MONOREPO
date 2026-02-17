#!/usr/bin/env node

/**
 * Script to create the first super user using direct database connection
 * This avoids circular dependency issues with TypeORM entities in Next.js
 * 
 * Usage: node scripts/create-super-user-direct.js
 */

const mysql = require('mysql2/promise');
const admin = require('firebase-admin');

require('dotenv').config();

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS || '{}');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

const adminAuth = admin.auth();

async function createSuperUser() {
    let connection;

    try {
        console.log('Connecting to database...\n');

        // Create database connection
        connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        console.log('Connected to database');

        // Check if user already exists
        const [existingUsers] = await connection.execute(
            'SELECT * FROM users WHERE email = ?',
            ['ikymasie@gmail.com']
        );

        let firebaseUid;
        let userId;

        if (existingUsers.length > 0) {
            console.log('User already exists in database');
            userId = existingUsers[0].id;
            firebaseUid = existingUsers[0].firebaseUid;

            // Create or update Firebase user
            if (!firebaseUid) {
                console.log('Creating Firebase user...');
                try {
                    const firebaseUser = await adminAuth.createUser({
                        email: 'ikymasie@gmail.com',
                        password: '12345678',
                        emailVerified: true,
                        displayName: 'Super User',
                    });
                    firebaseUid = firebaseUser.uid;

                    // Update database with Firebase UID
                    await connection.execute(
                        'UPDATE users SET firebaseUid = ? WHERE id = ?',
                        [firebaseUid, userId]
                    );

                    // Set custom claims
                    await adminAuth.setCustomUserClaims(firebaseUid, {
                        role: 'super_regulator',
                        tenantId: null,
                        userId: userId,
                    });

                    console.log('Firebase user created and linked');
                } catch (error) {
                    if (error.code === 'auth/email-already-exists') {
                        const firebaseUser = await adminAuth.getUserByEmail('ikymasie@gmail.com');
                        firebaseUid = firebaseUser.uid;

                        await connection.execute(
                            'UPDATE users SET firebaseUid = ? WHERE id = ?',
                            [firebaseUid, userId]
                        );

                        await adminAuth.setCustomUserClaims(firebaseUid, {
                            role: 'super_regulator',
                            tenantId: null,
                            userId: userId,
                        });

                        console.log('Existing Firebase user linked');
                    } else {
                        throw error;
                    }
                }
            } else {
                console.log('User already linked to Firebase');
            }
        } else {
            console.log('Creating new user...');

            // Create Firebase user first
            let firebaseUser;
            try {
                firebaseUser = await adminAuth.createUser({
                    email: 'ikymasie@gmail.com',
                    password: '12345678',
                    emailVerified: true,
                    displayName: 'Super User',
                });
                firebaseUid = firebaseUser.uid;
                console.log('Firebase user created');
            } catch (error) {
                if (error.code === 'auth/email-already-exists') {
                    firebaseUser = await adminAuth.getUserByEmail('ikymasie@gmail.com');
                    firebaseUid = firebaseUser.uid;
                    console.log('Using existing Firebase user');
                } else {
                    throw error;
                }
            }

            // Create database user
            const [result] = await connection.execute(
                `INSERT INTO users (
          id, email, firebaseUid, firstName, lastName, role, status,
          mfaEnabled, permissions, createdAt, updatedAt
        ) VALUES (
          UUID(), ?, ?, ?, ?, ?, ?,
          ?, ?, NOW(), NOW()
        )`,
                [
                    'ikymasie@gmail.com',
                    firebaseUid,
                    'Super',
                    'User',
                    'super_regulator',
                    'active',
                    false,
                    JSON.stringify({
                        'system:manage': true,
                        'tenants:view_all': true,
                        'tenants:manage': true,
                        'users:manage': true,
                        'deductions:manage': true,
                        'reports:view_all': true,
                        'audit:view_all': true,
                    }),
                ]
            );

            // Get the created user ID
            const [createdUsers] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                ['ikymasie@gmail.com']
            );
            userId = createdUsers[0].id;

            // Set custom claims
            await adminAuth.setCustomUserClaims(firebaseUid, {
                role: 'super_regulator',
                tenantId: null,
                userId: userId,
            });

            console.log('Database user created');
        }

        console.log('\n✅ Super user created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User ID:', userId);
        console.log('Email: ikymasie@gmail.com');
        console.log('Password: 12345678');
        console.log('Role: super_regulator');
        console.log('Firebase UID:', firebaseUid);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\nYou can now login with these credentials at http://localhost:3000');

    } catch (error) {
        console.error('Error creating super user:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed');
        }
    }
}

createSuperUser();
