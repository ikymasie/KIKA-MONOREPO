#!/usr/bin/env node

/**
 * Script to create the users table manually
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createUsersTable() {
    let connection;

    try {
        console.log('Connecting to database...\n');

        connection = await mysql.createConnection({
            host: process.env.DATABASE_HOST,
            port: parseInt(process.env.DATABASE_PORT || '3306'),
            user: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
        });

        console.log('Connected to database');

        // Create users table
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        firebaseUid VARCHAR(255) UNIQUE,
        firstName VARCHAR(255) NOT NULL,
        lastName VARCHAR(255) NOT NULL,
        role ENUM('super_regulator', 'deduction_officer', 'field_auditor', 'compliance_officer', 
                  'saccos_admin', 'loan_officer', 'accountant', 'member_service_rep', 
                  'credit_committee', 'member', 'external_auditor', 'vendor') NOT NULL,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        phone VARCHAR(50),
        mfaEnabled BOOLEAN DEFAULT FALSE,
        mfaSecret VARCHAR(255),
        tenantId VARCHAR(36),
        lastLoginAt TIMESTAMP NULL,
        permissions JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_firebaseUid (firebaseUid)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        console.log('✅ Users table created successfully!');

    } catch (error) {
        console.error('Error creating users table:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed');
        }
    }
}

createUsersTable();
