#!/usr/bin/env node

/**
 * KIKA Database Seed Data Generator with Firebase Authentication
 * 
 * Generates comprehensive SQL seed data with Firebase-authenticated users
 * All users will have password: 123456
 * 
 * Usage: node scripts/generate-seed-data-with-auth.js
 * Output: scripts/seed-data.sql
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Initialize Firebase Admin
const admin = require('firebase-admin');

// Parse Firebase credentials from environment
const firebaseCredentials = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS || '{}');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(firebaseCredentials),
    });
}

const DEFAULT_PASSWORD = '123456';

// ============================================
// FIREBASE USER MANAGEMENT
// ============================================

async function createFirebaseUser(email, password, displayName) {
    try {
        // Check if user already exists
        try {
            const existingUser = await admin.auth().getUserByEmail(email);
            console.log(`   ℹ️  User ${email} already exists (UID: ${existingUser.uid})`);
            return existingUser.uid;
        } catch (error) {
            // User doesn't exist, create new one
            if (error.code === 'auth/user-not-found') {
                const userRecord = await admin.auth().createUser({
                    email,
                    password,
                    displayName,
                    emailVerified: true,
                });
                console.log(`   ✅ Created Firebase user: ${email} (UID: ${userRecord.uid})`);
                return userRecord.uid;
            }
            throw error;
        }
    } catch (error) {
        console.error(`   ❌ Error creating user ${email}:`, error.message);
        return null;
    }
}

async function deleteAllFirebaseUsers() {
    try {
        console.log('\n🗑️  Cleaning up existing Firebase users...');
        const listUsersResult = await admin.auth().listUsers(1000);
        const uids = listUsersResult.users.map(user => user.uid);

        if (uids.length > 0) {
            await admin.auth().deleteUsers(uids);
            console.log(`   ✅ Deleted ${uids.length} existing users`);
        } else {
            console.log('   ℹ️  No existing users to delete');
        }
    } catch (error) {
        console.error('   ❌ Error deleting users:', error.message);
    }
}

// ============================================
// DATA GENERATOR (Synchronous Helper)
// ============================================

class DataGenerator {
    constructor() {
        this.counters = {};
    }

    uuid() {
        return uuidv4();
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    randomFloat(min, max, decimals = 2) {
        const value = Math.random() * (max - min) + min;
        return parseFloat(value.toFixed(decimals));
    }

    randomDate(start, end) {
        const startTime = start.getTime();
        const endTime = end.getTime();
        const randomTime = startTime + Math.random() * (endTime - startTime);
        return new Date(randomTime);
    }

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    randomChoices(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateTime(date) {
        return date.toISOString().replace('T', ' ').split('.')[0];
    }

    escapeString(str) {
        if (!str) return '';
        return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
    }

    botswanaFirstName() {
        const names = [
            'Thabo', 'Mpho', 'Kgosi', 'Lesego', 'Keabetswe', 'Tshepo', 'Neo', 'Lorato',
            'Kagiso', 'Tebogo', 'Boitumelo', 'Kitso', 'Onalenna', 'Refilwe', 'Tumelo',
            'Katlego', 'Lebogang', 'Mothusi', 'Gorata', 'Phenyo', 'Keitumetse', 'Amogelang',
            'Goitseone', 'Khumo', 'Masego', 'Naledi', 'Oarabile', 'Pelonomi', 'Reatile',
            'Segolame', 'Tshegofatso', 'Warona', 'Yaone', 'Boago', 'Dineo', 'Gofaone'
        ];
        return this.randomChoice(names);
    }

    botswanaLastName() {
        const names = [
            'Molefe', 'Kgalemang', 'Moeti', 'Seretse', 'Gaborone', 'Tshwane', 'Modise',
            'Mogapi', 'Kgosana', 'Mmusi', 'Kebonang', 'Marumo', 'Setlhare', 'Tiro',
            'Motlhanka', 'Kebaabetswe', 'Mogorosi', 'Ramotswa', 'Segwagwa', 'Tlhagale',
            'Kedikilwe', 'Makgalemele', 'Mosweu', 'Nkwe', 'Raditladi', 'Seboni', 'Tawana'
        ];
        return this.randomChoice(names);
    }

    botswanaLocation() {
        const locations = [
            'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Serowe', 'Palapye',
            'Molepolole', 'Kanye', 'Mochudi', 'Lobatse', 'Selibe Phikwe', 'Jwaneng'
        ];
        return this.randomChoice(locations);
    }

    nationalId() {
        return this.randomInt(100000000, 999999999).toString();
    }

    phoneNumber() {
        const prefixes = ['71', '72', '73', '74', '75', '76', '77'];
        return `267${this.randomChoice(prefixes)}${this.randomInt(100000, 999999)}`;
    }

    email(firstName, lastName, domain = 'gmail.com') {
        return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
    }
}

// ============================================
// SQL BUILDER
// ============================================

class SQLBuilder {
    constructor() {
        this.statements = [];
        this.gen = new DataGenerator();
    }

    addSection(title) {
        this.statements.push(`\n-- ${'='.repeat(60)}`);
        this.statements.push(`-- ${title}`);
        this.statements.push(`-- ${'='.repeat(60)}\n`);
    }

    addInsert(table, columns, rows) {
        if (rows.length === 0) return;

        const columnList = columns.join(', ');
        const valuesList = rows.map(row => {
            const values = row.map(value => {
                if (value === null || value === undefined) return 'NULL';
                if (typeof value === 'string') return `'${this.gen.escapeString(value)}'`;
                if (typeof value === 'boolean') return value ? '1' : '0';
                if (value instanceof Date) return `'${this.gen.formatDateTime(value)}'`;
                return value;
            });
            return `(${values.join(', ')})`;
        });

        // Batch inserts for performance (500 rows per statement)
        const batchSize = 500;
        for (let i = 0; i < valuesList.length; i += batchSize) {
            const batch = valuesList.slice(i, i + batchSize);
            this.statements.push(
                `INSERT INTO ${table} (${columnList}) VALUES\n${batch.join(',\n')};\n`
            );
        }
    }

    build() {
        return this.statements.join('\n');
    }
}

// ============================================
// MAIN SEED GENERATOR
// ============================================

async function generateSeedData() {
    const gen = new DataGenerator();
    const sql = new SQLBuilder();

    console.log('🚀 Starting KIKA seed data generation with Firebase authentication...\n');

    // Optional: Clean up existing Firebase users
    // await deleteAllFirebaseUsers();

    // Header
    sql.statements.push('-- ============================================');
    sql.statements.push('-- KIKA Database Seed Data with Firebase Auth');
    sql.statements.push(`-- Generated: ${new Date().toISOString()}`);
    sql.statements.push(`-- Default Password: ${DEFAULT_PASSWORD}`);
    sql.statements.push('-- ============================================\n');
    sql.statements.push('SET FOREIGN_KEY_CHECKS = 0;');
    sql.statements.push('SET AUTOCOMMIT = 0;\n');

    // ============================================
    // PHASE 1: TENANTS
    // ============================================

    console.log('📦 Phase 1: Creating Tenants...');
    sql.addSection('PHASE 1: TENANTS');

    const tenants = [];
    const tenantConfigs = [
        { name: 'Botswana Government Employees SACCOS', code: 'BGES', regNum: 'REG-2020-001', regDate: '2020-03-15', maxLoan: 500000, color1: '#0ea5e9', color2: '#d946ef' },
        { name: 'Teachers SACCOS', code: 'TSAC', regNum: 'REG-2019-045', regDate: '2019-08-22', maxLoan: 300000, color1: '#10b981', color2: '#f59e0b' },
        { name: 'Police Officers SACCOS', code: 'PSAC', regNum: 'REG-2018-112', regDate: '2018-11-10', maxLoan: 350000, color1: '#3b82f6', color2: '#ef4444' },
        { name: 'Healthcare Workers SACCOS', code: 'HWSAC', regNum: 'REG-2021-023', regDate: '2021-02-05', maxLoan: 250000, color1: '#8b5cf6', color2: '#ec4899' },
        { name: 'Gaborone City Council SACCOS', code: 'GCCSAC', regNum: 'REG-2017-089', regDate: '2017-06-18', maxLoan: 200000, color1: '#f97316', color2: '#06b6d4' },
    ];

    const tenantRows = [];
    tenantConfigs.forEach(config => {
        const id = gen.uuid();
        tenants.push({ id, name: config.name, code: config.code });
        tenantRows.push([
            id, config.name, config.code, 'active', config.regNum, config.regDate,
            `Plot ${gen.randomInt(1000, 9999)}, ${gen.botswanaLocation()}`,
            gen.phoneNumber(), `info@${config.code.toLowerCase()}.co.bw`,
            null, config.maxLoan, null, 40.00, 10.00, null, null,
            config.color1, config.color2, null, null, gen.randomFloat(75, 95),
            'good', gen.formatDate(new Date()), false, new Date(), new Date()
        ]);
    });

    sql.addInsert('tenants', [
        'id', 'name', 'code', 'status', 'registrationNumber', 'registrationDate',
        'address', 'phone', 'email', 'bylaws', 'maxBorrowingLimit',
        'regulatorDeductionCap', 'maxDeductionPercentage', 'liquidityRatioTarget',
        'kycConfiguration', 'logoUrl', 'primaryColor', 'secondaryColor',
        'brandingSettings', 'workflowConfiguration', 'currentComplianceScore',
        'complianceRating', 'lastComplianceReviewDate', 'isMaintenanceMode',
        'createdAt', 'updatedAt'
    ], tenantRows);

    console.log(`   ✅ Created ${tenants.length} tenants\n`);

    // ============================================
    // PHASE 2: USERS WITH FIREBASE AUTH
    // ============================================

    console.log('👥 Phase 2: Creating Users with Firebase Authentication...');
    sql.addSection('PHASE 2: USERS WITH FIREBASE AUTHENTICATION');

    const userRows = [];
    let userCount = 0;

    // Regulatory Users
    const regulatoryRoles = [
        { role: 'dcd_director', count: 2 }, { role: 'dcd_field_officer', count: 5 },
        { role: 'dcd_compliance_officer', count: 3 }, { role: 'bob_prudential_supervisor', count: 2 },
        { role: 'bob_financial_auditor', count: 2 }, { role: 'bob_compliance_officer', count: 2 },
        { role: 'deduction_officer', count: 3 }, { role: 'registry_clerk', count: 2 },
        { role: 'intelligence_liaison', count: 1 }, { role: 'legal_officer', count: 2 },
        { role: 'registrar', count: 1 }, { role: 'director_cooperatives', count: 1 },
        { role: 'minister_delegate', count: 1 },
    ];

    console.log('   Creating regulatory users...');
    for (const { role, count } of regulatoryRoles) {
        for (let i = 0; i < count; i++) {
            const firstName = gen.botswanaFirstName();
            const lastName = gen.botswanaLastName();
            const email = gen.email(firstName, lastName, 'gov.bw');
            const displayName = `${firstName} ${lastName}`;

            const firebaseUid = await createFirebaseUser(email, DEFAULT_PASSWORD, displayName);

            userRows.push([
                gen.uuid(), email, firebaseUid, firstName, lastName, role, 'active',
                gen.phoneNumber(), false, null, null, null, null, null, null, false, null,
                new Date(), new Date()
            ]);
            userCount++;
        }
    }

    // Tenant-specific users
    const tenantRoles = [
        { role: 'saccos_admin', count: 2 }, { role: 'loan_officer', count: 3 },
        { role: 'accountant', count: 2 }, { role: 'member_service_rep', count: 2 },
        { role: 'credit_committee', count: 5 },
    ];

    console.log('   Creating tenant-specific users...');
    for (const tenant of tenants) {
        for (const { role, count } of tenantRoles) {
            for (let i = 0; i < count; i++) {
                const firstName = gen.botswanaFirstName();
                const lastName = gen.botswanaLastName();
                const email = gen.email(firstName, lastName, `${tenant.code.toLowerCase()}.co.bw`);
                const displayName = `${firstName} ${lastName}`;

                const firebaseUid = await createFirebaseUser(email, DEFAULT_PASSWORD, displayName);

                userRows.push([
                    gen.uuid(), email, firebaseUid, firstName, lastName, role, 'active',
                    gen.phoneNumber(), false, null, tenant.id, null, null, null, null, false, null,
                    new Date(), new Date()
                ]);
                userCount++;
            }
        }
    }

    // External users
    const externalRoles = [
        { role: 'external_auditor', count: 3 },
        { role: 'vendor', count: 5 },
    ];

    console.log('   Creating external users...');
    for (const { role, count } of externalRoles) {
        for (let i = 0; i < count; i++) {
            const firstName = gen.botswanaFirstName();
            const lastName = gen.botswanaLastName();
            const email = gen.email(firstName, lastName);
            const displayName = `${firstName} ${lastName}`;

            const firebaseUid = await createFirebaseUser(email, DEFAULT_PASSWORD, displayName);

            userRows.push([
                gen.uuid(), email, firebaseUid, firstName, lastName, role, 'active',
                gen.phoneNumber(), false, null, null, null, null, null, null, false, null,
                new Date(), new Date()
            ]);
            userCount++;
        }
    }

    sql.addInsert('users', [
        'id', 'email', 'firebaseUid', 'firstName', 'lastName', 'role', 'status',
        'phone', 'mfaEnabled', 'mfaSecret', 'tenantId', 'lastLoginAt',
        'permissions', 'notificationPreferences', 'temporaryPassword',
        'mustChangePassword', 'passwordChangedAt', 'createdAt', 'updatedAt'
    ], userRows);

    console.log(`   ✅ Created ${userCount} users with Firebase authentication\n`);

    // ============================================
    // FOOTER
    // ============================================

    sql.statements.push('\n-- Commit all changes');
    sql.statements.push('COMMIT;');
    sql.statements.push('SET FOREIGN_KEY_CHECKS = 1;\n');

    console.log('✅ Seed data generation complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Tenants: ${tenants.length}`);
    console.log(`   - Users (with Firebase auth): ${userCount}`);
    console.log(`   - Default Password: ${DEFAULT_PASSWORD}\n`);

    return sql.build();
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
    try {
        const sql = await generateSeedData();

        const outputPath = path.join(__dirname, 'seed-data-with-auth.sql');
        fs.writeFileSync(outputPath, sql, 'utf8');

        console.log(`💾 SQL file written to: ${outputPath}`);
        console.log('\n🎯 Next steps:');
        console.log('   1. Review the generated SQL file');
        console.log('   2. Open MySQL Workbench');
        console.log('   3. Connect to your database');
        console.log('   4. File > Open SQL Script > select seed-data-with-auth.sql');
        console.log('   5. Execute the script');
        console.log(`   6. Log in with any user email and password: ${DEFAULT_PASSWORD}`);
        console.log('\n✨ Done!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error generating seed data:', error);
        process.exit(1);
    }
}

// Check dependencies
try {
    require.resolve('uuid');
    require.resolve('firebase-admin');
    require.resolve('dotenv');
    main();
} catch (e) {
    console.error('❌ Missing required packages');
    console.log('\n📦 Please install dependencies:');
    console.log('   npm install uuid firebase-admin dotenv\n');
    process.exit(1);
}
