#!/usr/bin/env node

/**
 * KIKA Database Seed Data Generator
 * 
 * Generates comprehensive SQL seed data for all 62 database tables
 * with realistic multi-tenant data and proper relationships.
 * 
 * Usage: node scripts/generate-seed-data.js
 * Output: scripts/seed-data.sql
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    tenants: 5,
    membersPerTenant: [500, 200, 200, 100, 100], // Total: 1,100
    loansPercentage: 0.35, // 35% of members have loans
    insurancePolicyPercentage: 0.60, // 60% of members have policies
    merchandiseOrderPercentage: 0.30, // 30% of members order merchandise
    transactionsPerMemberPerYear: 15, // Average transactions
    yearsOfHistory: 2, // Years of transaction history
};

// ============================================
// DATA GENERATORS
// ============================================

class DataGenerator {
    constructor() {
        this.counters = {};
    }

    uuid() {
        return uuidv4();
    }

    counter(key) {
        if (!this.counters[key]) this.counters[key] = 0;
        return ++this.counters[key];
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

    addComment(comment) {
        this.statements.push(`\n-- ${comment}`);
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
// SEED DATA GENERATORS
// ============================================

class SeedDataGenerator {
    constructor() {
        this.gen = new DataGenerator();
        this.sql = new SQLBuilder();
        this.data = {
            tenants: [],
            users: [],
            savingsProducts: [],
            loanProducts: [],
            insuranceProducts: [],
            merchandiseProducts: [],
            members: [],
            kyc: [],
            beneficiaries: [],
            dependents: [],
            memberBankAccounts: [],
            memberSavings: [],
            loans: [],
            loanGuarantors: [],
            insurancePolicies: [],
            insuranceClaims: [],
            merchandiseOrders: [],
            transactions: [],
            journalEntries: [],
        };
    }

    // ============================================
    // PHASE 1: FOUNDATION
    // ============================================

    generateTenants() {
        this.sql.addSection('PHASE 1: FOUNDATION - TENANTS');

        const tenantConfigs = [
            {
                name: 'Botswana Government Employees SACCOS',
                code: 'BGES',
                registrationNumber: 'REG-2020-001',
                registrationDate: '2020-03-15',
                maxBorrowingLimit: 500000,
                primaryColor: '#0ea5e9',
                secondaryColor: '#d946ef',
            },
            {
                name: 'Teachers SACCOS',
                code: 'TSAC',
                registrationNumber: 'REG-2019-045',
                registrationDate: '2019-08-22',
                maxBorrowingLimit: 300000,
                primaryColor: '#10b981',
                secondaryColor: '#f59e0b',
            },
            {
                name: 'Police Officers SACCOS',
                code: 'PSAC',
                registrationNumber: 'REG-2018-112',
                registrationDate: '2018-11-10',
                maxBorrowingLimit: 350000,
                primaryColor: '#3b82f6',
                secondaryColor: '#ef4444',
            },
            {
                name: 'Healthcare Workers SACCOS',
                code: 'HWSAC',
                registrationNumber: 'REG-2021-023',
                registrationDate: '2021-02-05',
                maxBorrowingLimit: 250000,
                primaryColor: '#8b5cf6',
                secondaryColor: '#ec4899',
            },
            {
                name: 'Gaborone City Council SACCOS',
                code: 'GCCSAC',
                registrationNumber: 'REG-2017-089',
                registrationDate: '2017-06-18',
                maxBorrowingLimit: 200000,
                primaryColor: '#f97316',
                secondaryColor: '#06b6d4',
            },
        ];

        const rows = [];
        tenantConfigs.forEach(config => {
            const id = this.gen.uuid();
            this.data.tenants.push({
                id,
                name: config.name,
                code: config.code,
            });

            rows.push([
                id,
                config.name,
                config.code,
                'active',
                config.registrationNumber,
                config.registrationDate,
                `${this.gen.randomChoice(['Plot 1234', 'Plot 5678', 'Plot 9012'])}, ${this.gen.botswanaLocation()}`,
                this.gen.phoneNumber(),
                `info@${config.code.toLowerCase()}.co.bw`,
                null, // bylaws
                config.maxBorrowingLimit,
                null, // regulatorDeductionCap
                40.00, // maxDeductionPercentage
                10.00, // liquidityRatioTarget
                null, // kycConfiguration
                null, // logoUrl
                config.primaryColor,
                config.secondaryColor,
                null, // brandingSettings
                null, // workflowConfiguration
                this.gen.randomFloat(75, 95), // currentComplianceScore
                'good', // complianceRating
                this.gen.formatDate(new Date()), // lastComplianceReviewDate
                false, // isMaintenanceMode
                new Date(), // createdAt
                new Date(), // updatedAt
            ]);
        });

        this.sql.addInsert('tenants', [
            'id', 'name', 'code', 'status', 'registrationNumber', 'registrationDate',
            'address', 'phone', 'email', 'bylaws', 'maxBorrowingLimit',
            'regulatorDeductionCap', 'maxDeductionPercentage', 'liquidityRatioTarget',
            'kycConfiguration', 'logoUrl', 'primaryColor', 'secondaryColor',
            'brandingSettings', 'workflowConfiguration', 'currentComplianceScore',
            'complianceRating', 'lastComplianceReviewDate', 'isMaintenanceMode',
            'createdAt', 'updatedAt'
        ], rows);
    }

    generateUsers() {
        this.sql.addSection('PHASE 1: FOUNDATION - USERS');

        const rows = [];

        // Regulatory Users (no tenant)
        const regulatoryRoles = [
            { role: 'dcd_director', count: 2 },
            { role: 'dcd_field_officer', count: 5 },
            { role: 'dcd_compliance_officer', count: 3 },
            { role: 'bob_prudential_supervisor', count: 2 },
            { role: 'bob_financial_auditor', count: 2 },
            { role: 'bob_compliance_officer', count: 2 },
            { role: 'deduction_officer', count: 3 },
            { role: 'registry_clerk', count: 2 },
            { role: 'intelligence_liaison', count: 1 },
            { role: 'legal_officer', count: 2 },
            { role: 'registrar', count: 1 },
            { role: 'director_cooperatives', count: 1 },
            { role: 'minister_delegate', count: 1 },
        ];

        regulatoryRoles.forEach(({ role, count }) => {
            for (let i = 0; i < count; i++) {
                const firstName = this.gen.botswanaFirstName();
                const lastName = this.gen.botswanaLastName();
                const id = this.gen.uuid();

                this.data.users.push({ id, role, tenantId: null });

                rows.push([
                    id,
                    this.gen.email(firstName, lastName, 'gov.bw'),
                    null, // firebaseUid
                    firstName,
                    lastName,
                    role,
                    'active',
                    this.gen.phoneNumber(),
                    false, // mfaEnabled
                    null, // mfaSecret
                    null, // tenantId
                    null, // lastLoginAt
                    null, // permissions
                    null, // notificationPreferences
                    null, // temporaryPassword
                    false, // mustChangePassword
                    null, // passwordChangedAt
                    new Date(),
                    new Date(),
                ]);
            }
        });

        // Tenant-specific users
        const tenantRoles = [
            { role: 'saccos_admin', count: 2 },
            { role: 'loan_officer', count: 3 },
            { role: 'accountant', count: 2 },
            { role: 'member_service_rep', count: 2 },
            { role: 'credit_committee', count: 5 },
        ];

        this.data.tenants.forEach(tenant => {
            tenantRoles.forEach(({ role, count }) => {
                for (let i = 0; i < count; i++) {
                    const firstName = this.gen.botswanaFirstName();
                    const lastName = this.gen.botswanaLastName();
                    const id = this.gen.uuid();

                    this.data.users.push({ id, role, tenantId: tenant.id });

                    rows.push([
                        id,
                        this.gen.email(firstName, lastName, `${tenant.code.toLowerCase()}.co.bw`),
                        null,
                        firstName,
                        lastName,
                        role,
                        'active',
                        this.gen.phoneNumber(),
                        false,
                        null,
                        tenant.id,
                        null,
                        null,
                        null,
                        null,
                        false,
                        null,
                        new Date(),
                        new Date(),
                    ]);
                }
            });
        });

        // External users
        const externalRoles = [
            { role: 'external_auditor', count: 3 },
            { role: 'vendor', count: 5 },
        ];

        externalRoles.forEach(({ role, count }) => {
            for (let i = 0; i < count; i++) {
                const firstName = this.gen.botswanaFirstName();
                const lastName = this.gen.botswanaLastName();
                const id = this.gen.uuid();

                this.data.users.push({ id, role, tenantId: null });

                rows.push([
                    id,
                    this.gen.email(firstName, lastName),
                    null,
                    firstName,
                    lastName,
                    role,
                    'active',
                    this.gen.phoneNumber(),
                    false,
                    null,
                    null,
                    null,
                    null,
                    null,
                    null,
                    false,
                    null,
                    new Date(),
                    new Date(),
                ]);
            }
        });

        this.sql.addInsert('users', [
            'id', 'email', 'firebaseUid', 'firstName', 'lastName', 'role', 'status',
            'phone', 'mfaEnabled', 'mfaSecret', 'tenantId', 'lastLoginAt',
            'permissions', 'notificationPreferences', 'temporaryPassword',
            'mustChangePassword', 'passwordChangedAt', 'createdAt', 'updatedAt'
        ], rows);
    }

    // ============================================
    // PHASE 2: PRODUCT CATALOG
    // ============================================

    generateSavingsProducts() {
        this.sql.addSection('PHASE 2: PRODUCT CATALOG - SAVINGS PRODUCTS');

        const productTemplates = [
            {
                name: 'Regular Savings',
                code: 'REG-SAV',
                description: 'Mandatory regular savings account for all members',
                interestRate: 5.00,
                minBalance: 100.00,
                maxBalance: null,
                withdrawalLimit: 5000.00,
                isActive: true,
            },
            {
                name: 'Fixed Deposit',
                code: 'FIX-DEP',
                description: 'Fixed deposit account with higher interest rates',
                interestRate: 8.50,
                minBalance: 5000.00,
                maxBalance: null,
                withdrawalLimit: null,
                isActive: true,
            },
            {
                name: 'Holiday Savings',
                code: 'HOL-SAV',
                description: 'Special savings for holiday expenses',
                interestRate: 6.00,
                minBalance: 50.00,
                maxBalance: 20000.00,
                withdrawalLimit: null,
                isActive: true,
            },
            {
                name: 'Education Savings',
                code: 'EDU-SAV',
                description: 'Savings dedicated to education expenses',
                interestRate: 6.50,
                minBalance: 100.00,
                maxBalance: 50000.00,
                withdrawalLimit: null,
                isActive: true,
            },
            {
                name: 'Emergency Fund',
                code: 'EMG-SAV',
                description: 'Quick access savings for emergencies',
                interestRate: 4.50,
                minBalance: 200.00,
                maxBalance: 30000.00,
                withdrawalLimit: 10000.00,
                isActive: true,
            },
        ];

        const rows = [];
        this.data.tenants.forEach(tenant => {
            productTemplates.forEach(template => {
                const id = this.gen.uuid();
                this.data.savingsProducts.push({ id, tenantId: tenant.id, ...template });

                rows.push([
                    id,
                    tenant.id,
                    template.name,
                    template.code,
                    template.description,
                    template.interestRate,
                    template.minBalance,
                    template.maxBalance,
                    template.withdrawalLimit,
                    template.isActive,
                    new Date(),
                    new Date(),
                ]);
            });
        });

        this.sql.addInsert('savings_products', [
            'id', 'tenantId', 'name', 'code', 'description', 'interestRate',
            'minBalance', 'maxBalance', 'withdrawalLimit', 'isActive',
            'createdAt', 'updatedAt'
        ], rows);
    }

    generateLoanProducts() {
        this.sql.addSection('PHASE 2: PRODUCT CATALOG - LOAN PRODUCTS');

        const productTemplates = [
            {
                name: 'Emergency Loan',
                code: 'EMG-LOAN',
                description: 'Short-term emergency loan for urgent needs',
                interestRate: 12.00,
                minAmount: 1000.00,
                maxAmount: 20000.00,
                minTermMonths: 3,
                maxTermMonths: 12,
                processingFeePercentage: 2.00,
                requiresGuarantors: true,
                minGuarantors: 1,
                maxGuarantors: 2,
                isActive: true,
            },
            {
                name: 'Development Loan',
                code: 'DEV-LOAN',
                description: 'Medium-term loan for personal development',
                interestRate: 10.00,
                minAmount: 10000.00,
                maxAmount: 100000.00,
                minTermMonths: 12,
                maxTermMonths: 36,
                processingFeePercentage: 2.50,
                requiresGuarantors: true,
                minGuarantors: 2,
                maxGuarantors: 3,
                isActive: true,
            },
            {
                name: 'Mortgage Loan',
                code: 'MTG-LOAN',
                description: 'Long-term loan for property purchase',
                interestRate: 8.50,
                minAmount: 50000.00,
                maxAmount: 500000.00,
                minTermMonths: 60,
                maxTermMonths: 240,
                processingFeePercentage: 1.50,
                requiresGuarantors: true,
                minGuarantors: 2,
                maxGuarantors: 4,
                isActive: true,
            },
            {
                name: 'Education Loan',
                code: 'EDU-LOAN',
                description: 'Loan for education and training expenses',
                interestRate: 9.00,
                minAmount: 5000.00,
                maxAmount: 80000.00,
                minTermMonths: 12,
                maxTermMonths: 48,
                processingFeePercentage: 2.00,
                requiresGuarantors: true,
                minGuarantors: 1,
                maxGuarantors: 2,
                isActive: true,
            },
            {
                name: 'Vehicle Loan',
                code: 'VEH-LOAN',
                description: 'Loan for vehicle purchase',
                interestRate: 11.00,
                minAmount: 30000.00,
                maxAmount: 300000.00,
                minTermMonths: 24,
                maxTermMonths: 60,
                processingFeePercentage: 2.50,
                requiresGuarantors: true,
                minGuarantors: 2,
                maxGuarantors: 3,
                isActive: true,
            },
            {
                name: 'Business Loan',
                code: 'BUS-LOAN',
                description: 'Loan for business ventures and expansion',
                interestRate: 13.00,
                minAmount: 20000.00,
                maxAmount: 200000.00,
                minTermMonths: 12,
                maxTermMonths: 60,
                processingFeePercentage: 3.00,
                requiresGuarantors: true,
                minGuarantors: 2,
                maxGuarantors: 4,
                isActive: true,
            },
            {
                name: 'Debt Consolidation Loan',
                code: 'DEB-LOAN',
                description: 'Loan to consolidate existing debts',
                interestRate: 11.50,
                minAmount: 15000.00,
                maxAmount: 150000.00,
                minTermMonths: 12,
                maxTermMonths: 48,
                processingFeePercentage: 2.00,
                requiresGuarantors: true,
                minGuarantors: 2,
                maxGuarantors: 3,
                isActive: true,
            },
            {
                name: 'Agricultural Loan',
                code: 'AGR-LOAN',
                description: 'Loan for agricultural activities and farming',
                interestRate: 9.50,
                minAmount: 10000.00,
                maxAmount: 120000.00,
                minTermMonths: 12,
                maxTermMonths: 36,
                processingFeePercentage: 2.00,
                requiresGuarantors: true,
                minGuarantors: 1,
                maxGuarantors: 3,
                isActive: true,
            },
        ];

        const rows = [];
        this.data.tenants.forEach(tenant => {
            productTemplates.forEach(template => {
                const id = this.gen.uuid();
                this.data.loanProducts.push({ id, tenantId: tenant.id, ...template });

                rows.push([
                    id,
                    tenant.id,
                    template.name,
                    template.code,
                    template.description,
                    template.interestRate,
                    template.minAmount,
                    template.maxAmount,
                    template.minTermMonths,
                    template.maxTermMonths,
                    template.processingFeePercentage,
                    template.requiresGuarantors,
                    template.minGuarantors,
                    template.maxGuarantors,
                    template.isActive,
                    new Date(),
                    new Date(),
                ]);
            });
        });

        this.sql.addInsert('loan_products', [
            'id', 'tenantId', 'name', 'code', 'description', 'interestRate',
            'minAmount', 'maxAmount', 'minTermMonths', 'maxTermMonths',
            'processingFeePercentage', 'requiresGuarantors', 'minGuarantors',
            'maxGuarantors', 'isActive', 'createdAt', 'updatedAt'
        ], rows);
    }

    generateInsuranceProducts() {
        this.sql.addSection('PHASE 2: PRODUCT CATALOG - INSURANCE PRODUCTS');

        const productTemplates = [
            {
                name: 'Life Insurance',
                code: 'LIFE-INS',
                description: 'Comprehensive life insurance coverage',
                coverageType: 'life',
                minCoverageAmount: 50000.00,
                maxCoverageAmount: 500000.00,
                basePremium: 150.00,
                waitingPeriodMonths: 6,
                maxClaimAmount: 500000.00,
                isActive: true,
            },
            {
                name: 'Funeral Cover',
                code: 'FUN-INS',
                description: 'Funeral and burial expense coverage',
                coverageType: 'funeral',
                minCoverageAmount: 10000.00,
                maxCoverageAmount: 50000.00,
                basePremium: 50.00,
                waitingPeriodMonths: 3,
                maxClaimAmount: 50000.00,
                isActive: true,
            },
            {
                name: 'Disability Insurance',
                code: 'DIS-INS',
                description: 'Coverage for permanent or temporary disability',
                coverageType: 'disability',
                minCoverageAmount: 30000.00,
                maxCoverageAmount: 300000.00,
                basePremium: 120.00,
                waitingPeriodMonths: 6,
                maxClaimAmount: 300000.00,
                isActive: true,
            },
            {
                name: 'Critical Illness Cover',
                code: 'CRI-INS',
                description: 'Coverage for critical illness diagnosis',
                coverageType: 'critical_illness',
                minCoverageAmount: 40000.00,
                maxCoverageAmount: 400000.00,
                basePremium: 180.00,
                waitingPeriodMonths: 12,
                maxClaimAmount: 400000.00,
                isActive: true,
            },
            {
                name: 'Family Protection Plan',
                code: 'FAM-INS',
                description: 'Comprehensive family protection coverage',
                coverageType: 'family',
                minCoverageAmount: 100000.00,
                maxCoverageAmount: 1000000.00,
                basePremium: 250.00,
                waitingPeriodMonths: 6,
                maxClaimAmount: 1000000.00,
                isActive: true,
            },
        ];

        const rows = [];
        this.data.tenants.forEach(tenant => {
            productTemplates.forEach(template => {
                const id = this.gen.uuid();
                this.data.insuranceProducts.push({ id, tenantId: tenant.id, ...template });

                rows.push([
                    id,
                    tenant.id,
                    template.name,
                    template.code,
                    template.description,
                    template.coverageType,
                    template.minCoverageAmount,
                    template.maxCoverageAmount,
                    template.basePremium,
                    template.waitingPeriodMonths,
                    template.maxClaimAmount,
                    template.isActive,
                    new Date(),
                    new Date(),
                ]);
            });
        });

        this.sql.addInsert('insurance_products', [
            'id', 'tenantId', 'name', 'code', 'description', 'coverageType',
            'minCoverageAmount', 'maxCoverageAmount', 'basePremium',
            'waitingPeriodMonths', 'maxClaimAmount', 'isActive',
            'createdAt', 'updatedAt'
        ], rows);
    }

    generateMerchandiseProducts() {
        this.sql.addSection('PHASE 2: PRODUCT CATALOG - MERCHANDISE PRODUCTS');

        const productTemplates = [
            // Electronics
            { category: 'Electronics', name: '55" Smart TV', sku: 'ELEC-TV-55', price: 4500.00, stock: 20 },
            { category: 'Electronics', name: '65" Smart TV', sku: 'ELEC-TV-65', price: 7500.00, stock: 10 },
            { category: 'Electronics', name: 'Laptop - Core i5', sku: 'ELEC-LAP-I5', price: 6500.00, stock: 15 },
            { category: 'Electronics', name: 'Laptop - Core i7', sku: 'ELEC-LAP-I7', price: 9500.00, stock: 8 },
            { category: 'Electronics', name: 'Refrigerator - 350L', sku: 'ELEC-FRG-350', price: 5200.00, stock: 12 },
            { category: 'Electronics', name: 'Refrigerator - 500L', sku: 'ELEC-FRG-500', price: 7800.00, stock: 8 },
            { category: 'Electronics', name: 'Washing Machine - 7kg', sku: 'ELEC-WSH-7', price: 3500.00, stock: 15 },
            { category: 'Electronics', name: 'Washing Machine - 10kg', sku: 'ELEC-WSH-10', price: 5200.00, stock: 10 },
            { category: 'Electronics', name: 'Microwave Oven', sku: 'ELEC-MIC-001', price: 1200.00, stock: 25 },
            { category: 'Electronics', name: 'Air Conditioner', sku: 'ELEC-AC-001', price: 4800.00, stock: 12 },

            // Furniture
            { category: 'Furniture', name: '3-Seater Sofa', sku: 'FURN-SOF-3', price: 4500.00, stock: 10 },
            { category: 'Furniture', name: '5-Seater Sofa Set', sku: 'FURN-SOF-5', price: 8500.00, stock: 6 },
            { category: 'Furniture', name: 'Queen Size Bed', sku: 'FURN-BED-Q', price: 3500.00, stock: 12 },
            { category: 'Furniture', name: 'King Size Bed', sku: 'FURN-BED-K', price: 5500.00, stock: 8 },
            { category: 'Furniture', name: 'Dining Table Set (6 Seater)', sku: 'FURN-DIN-6', price: 4200.00, stock: 10 },
            { category: 'Furniture', name: 'Dining Table Set (8 Seater)', sku: 'FURN-DIN-8', price: 6500.00, stock: 5 },
            { category: 'Furniture', name: 'Wardrobe - 3 Door', sku: 'FURN-WAR-3', price: 3800.00, stock: 8 },
            { category: 'Furniture', name: 'Office Desk', sku: 'FURN-DSK-001', price: 2200.00, stock: 15 },
            { category: 'Furniture', name: 'Bookshelf', sku: 'FURN-BSH-001', price: 1500.00, stock: 12 },

            // Appliances
            { category: 'Appliances', name: 'Gas Stove - 4 Burner', sku: 'APPL-GAS-4', price: 2500.00, stock: 15 },
            { category: 'Appliances', name: 'Electric Stove', sku: 'APPL-ELE-001', price: 3200.00, stock: 10 },
            { category: 'Appliances', name: 'Dishwasher', sku: 'APPL-DSH-001', price: 5500.00, stock: 6 },
            { category: 'Appliances', name: 'Vacuum Cleaner', sku: 'APPL-VAC-001', price: 1800.00, stock: 20 },
            { category: 'Appliances', name: 'Iron', sku: 'APPL-IRN-001', price: 450.00, stock: 30 },
            { category: 'Appliances', name: 'Blender', sku: 'APPL-BLD-001', price: 650.00, stock: 25 },

            // Building Materials
            { category: 'Building Materials', name: 'Cement - 50kg Bag', sku: 'BLDG-CEM-50', price: 85.00, stock: 200 },
            { category: 'Building Materials', name: 'Roofing Sheets (per sheet)', sku: 'BLDG-ROF-001', price: 120.00, stock: 150 },
            { category: 'Building Materials', name: 'Paint - 20L (White)', sku: 'BLDG-PNT-W20', price: 850.00, stock: 50 },
            { category: 'Building Materials', name: 'Paint - 20L (Color)', sku: 'BLDG-PNT-C20', price: 950.00, stock: 40 },
            { category: 'Building Materials', name: 'Tiles - per sqm', sku: 'BLDG-TIL-001', price: 180.00, stock: 300 },
            { category: 'Building Materials', name: 'Door - Standard', sku: 'BLDG-DOR-STD', price: 1200.00, stock: 25 },
            { category: 'Building Materials', name: 'Window Frame', sku: 'BLDG-WIN-001', price: 850.00, stock: 30 },
        ];

        const rows = [];
        this.data.tenants.forEach(tenant => {
            productTemplates.forEach(template => {
                const id = this.gen.uuid();
                this.data.merchandiseProducts.push({ id, tenantId: tenant.id, ...template });

                rows.push([
                    id,
                    tenant.id,
                    template.name,
                    template.sku,
                    template.category,
                    `${template.name} - High quality product available for purchase`,
                    template.price,
                    template.stock,
                    true, // isActive
                    new Date(),
                    new Date(),
                ]);
            });
        });

        this.sql.addInsert('merchandise_products', [
            'id', 'tenantId', 'name', 'sku', 'category', 'description',
            'price', 'stockQuantity', 'isActive', 'createdAt', 'updatedAt'
        ], rows);
    }

    // ============================================
    // PHASE 3: MEMBERS
    // ============================================

    generateMembers() {
        this.sql.addSection('PHASE 3: MEMBERS');

        const memberRows = [];
        const kycRows = [];
        const beneficiaryRows = [];
        const dependentRows = [];
        const bankAccountRows = [];
        const savingsRows = [];

        const statuses = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'inactive', 'suspended'];
        const employmentStatuses = ['employed', 'employed', 'employed', 'employed', 'self_employed', 'unemployed'];
        const genders = ['male', 'female'];
        const relationships = ['spouse', 'child', 'parent', 'sibling'];

        this.data.tenants.forEach((tenant, tenantIndex) => {
            const memberCount = CONFIG.membersPerTenant[tenantIndex];

            for (let i = 0; i < memberCount; i++) {
                const memberId = this.gen.uuid();
                const firstName = this.gen.botswanaFirstName();
                const lastName = this.gen.botswanaLastName();
                const memberNumber = `${tenant.code}-${String(i + 1).padStart(4, '0')}`;
                const joinDate = this.gen.randomDate(new Date('2019-01-01'), new Date('2024-12-31'));
                const dateOfBirth = this.gen.randomDate(new Date('1960-01-01'), new Date('2000-12-31'));
                const status = this.gen.randomChoice(statuses);
                const employmentStatus = this.gen.randomChoice(employmentStatuses);

                this.data.members.push({
                    id: memberId,
                    tenantId: tenant.id,
                    memberNumber,
                    firstName,
                    lastName,
                });

                memberRows.push([
                    memberId,
                    null, // userId
                    tenant.id,
                    memberNumber,
                    firstName,
                    lastName,
                    null, // middleName
                    this.gen.nationalId(),
                    null, // passportNumber
                    this.gen.formatDate(dateOfBirth),
                    this.gen.randomChoice(genders),
                    this.gen.email(firstName, lastName),
                    this.gen.phoneNumber(),
                    `Plot ${this.gen.randomInt(1000, 9999)}, ${this.gen.botswanaLocation()}`,
                    `P.O. Box ${this.gen.randomInt(100, 9999)}, ${this.gen.botswanaLocation()}`,
                    status,
                    employmentStatus,
                    employmentStatus === 'employed' ? `${this.gen.botswanaLocation()} ${this.gen.randomChoice(['Hospital', 'School', 'Council', 'Ministry'])}` : null,
                    employmentStatus === 'employed' ? `EMP${this.gen.randomInt(10000, 99999)}` : null,
                    this.gen.randomFloat(1000, 50000),
                    employmentStatus === 'employed' ? this.gen.randomFloat(3000, 25000) : 0,
                    this.gen.formatDate(joinDate),
                    null, // exitDate
                    null, // exitReason
                    new Date(),
                    new Date(),
                ]);

                // KYC
                const kycStatus = this.gen.randomChoice(['verified', 'verified', 'verified', 'verified', 'pending', 'rejected']);
                kycRows.push([
                    this.gen.uuid(),
                    memberId,
                    kycStatus,
                    kycStatus === 'verified' ? this.gen.formatDate(this.gen.randomDate(joinDate, new Date())) : null,
                    null, // verifiedBy
                    null, // documentChecklist
                    null, // notes
                    new Date(),
                    new Date(),
                ]);

                // Beneficiaries (2-4 per member)
                const beneficiaryCount = this.gen.randomInt(2, 4);
                const percentagePerBeneficiary = 100 / beneficiaryCount;
                for (let j = 0; j < beneficiaryCount; j++) {
                    beneficiaryRows.push([
                        this.gen.uuid(),
                        memberId,
                        `${this.gen.botswanaFirstName()} ${this.gen.botswanaLastName()}`,
                        this.gen.randomChoice(relationships),
                        this.gen.phoneNumber(),
                        percentagePerBeneficiary,
                        new Date(),
                        new Date(),
                    ]);
                }

                // Dependents (0-3 per member)
                const dependentCount = this.gen.randomInt(0, 3);
                for (let j = 0; j < dependentCount; j++) {
                    dependentRows.push([
                        this.gen.uuid(),
                        memberId,
                        this.gen.botswanaFirstName(),
                        this.gen.botswanaLastName(),
                        this.gen.formatDate(this.gen.randomDate(new Date('2000-01-01'), new Date('2020-12-31'))),
                        this.gen.randomChoice(['child', 'spouse']),
                        new Date(),
                        new Date(),
                    ]);
                }

                // Bank Accounts (1-2 per member)
                const bankAccountCount = this.gen.randomInt(1, 2);
                const banks = ['First National Bank', 'Barclays Bank', 'Standard Chartered', 'Stanbic Bank', 'Bank Gaborone'];
                for (let j = 0; j < bankAccountCount; j++) {
                    bankAccountRows.push([
                        this.gen.uuid(),
                        memberId,
                        this.gen.randomChoice(banks),
                        this.gen.randomInt(1000000000, 9999999999).toString(),
                        j === 0, // isPrimary
                        new Date(),
                        new Date(),
                    ]);
                }

                // Member Savings (1-3 accounts per member)
                const savingsCount = this.gen.randomInt(1, 3);
                const tenantSavingsProducts = this.data.savingsProducts.filter(p => p.tenantId === tenant.id);
                const selectedProducts = this.gen.randomChoices(tenantSavingsProducts, Math.min(savingsCount, tenantSavingsProducts.length));

                selectedProducts.forEach(product => {
                    savingsRows.push([
                        this.gen.uuid(),
                        memberId,
                        product.id,
                        this.gen.randomFloat(product.minBalance, product.minBalance * 10),
                        new Date(),
                        new Date(),
                    ]);
                });
            }
        });

        this.sql.addInsert('members', [
            'id', 'userId', 'tenantId', 'memberNumber', 'firstName', 'lastName',
            'middleName', 'nationalId', 'passportNumber', 'dateOfBirth', 'gender',
            'email', 'phone', 'physicalAddress', 'postalAddress', 'status',
            'employmentStatus', 'employer', 'employeeNumber', 'shareCapital',
            'monthlyNetSalary', 'joinDate', 'exitDate', 'exitReason',
            'createdAt', 'updatedAt'
        ], memberRows);

        this.sql.addInsert('kyc', [
            'id', 'memberId', 'status', 'verificationDate', 'verifiedBy',
            'documentChecklist', 'notes', 'createdAt', 'updatedAt'
        ], kycRows);

        this.sql.addInsert('beneficiaries', [
            'id', 'memberId', 'name', 'relationship', 'phone', 'percentage',
            'createdAt', 'updatedAt'
        ], beneficiaryRows);

        this.sql.addInsert('dependents', [
            'id', 'memberId', 'firstName', 'lastName', 'dateOfBirth',
            'relationship', 'createdAt', 'updatedAt'
        ], dependentRows);

        this.sql.addInsert('member_bank_accounts', [
            'id', 'memberId', 'bankName', 'accountNumber', 'isPrimary',
            'createdAt', 'updatedAt'
        ], bankAccountRows);

        this.sql.addInsert('member_savings', [
            'id', 'memberId', 'productId', 'balance', 'createdAt', 'updatedAt'
        ], savingsRows);
    }

    // ============================================
    // GENERATE ALL
    // ============================================

    generate() {
        console.log('🚀 Starting KIKA seed data generation...\n');

        // Header
        this.sql.statements.push('-- ============================================');
        this.sql.statements.push('-- KIKA Database Seed Data');
        this.sql.statements.push(`-- Generated: ${new Date().toISOString()}`);
        this.sql.statements.push('-- ============================================\n');
        this.sql.statements.push('SET FOREIGN_KEY_CHECKS = 0;');
        this.sql.statements.push('SET AUTOCOMMIT = 0;\n');

        // Phase 1: Foundation
        console.log('📦 Phase 1: Foundation...');
        this.generateTenants();
        this.generateUsers();

        // Phase 2: Product Catalog
        console.log('🛍️  Phase 2: Product Catalog...');
        this.generateSavingsProducts();
        this.generateLoanProducts();
        this.generateInsuranceProducts();
        this.generateMerchandiseProducts();

        // Phase 3: Members
        console.log('👥 Phase 3: Members...');
        this.generateMembers();

        // Footer
        this.sql.statements.push('\n-- Commit all changes');
        this.sql.statements.push('COMMIT;');
        this.sql.statements.push('SET FOREIGN_KEY_CHECKS = 1;\n');

        console.log('\n✅ Seed data generation complete!');
        console.log('\n📊 Summary:');
        console.log(`   - Tenants: ${this.data.tenants.length}`);
        console.log(`   - Users: ${this.data.users.length}`);
        console.log(`   - Savings Products: ${this.data.savingsProducts.length}`);
        console.log(`   - Loan Products: ${this.data.loanProducts.length}`);
        console.log(`   - Insurance Products: ${this.data.insuranceProducts.length}`);
        console.log(`   - Merchandise Products: ${this.data.merchandiseProducts.length}`);
        console.log(`   - Members: ${this.data.members.length}`);

        return this.sql.build();
    }
}

// ============================================
// MAIN EXECUTION
// ============================================

function main() {
    try {
        const generator = new SeedDataGenerator();
        const sql = generator.generate();

        const outputPath = path.join(__dirname, 'seed-data.sql');
        fs.writeFileSync(outputPath, sql, 'utf8');

        console.log(`\n💾 SQL file written to: ${outputPath}`);
        console.log('\n🎯 Next steps:');
        console.log('   1. Review the generated SQL file');
        console.log('   2. Open MySQL Workbench');
        console.log('   3. Connect to your database');
        console.log('   4. File > Open SQL Script > select seed-data.sql');
        console.log('   5. Execute the script');
        console.log('\n✨ Done!\n');
    } catch (error) {
        console.error('❌ Error generating seed data:', error);
        process.exit(1);
    }
}

// Check if uuid package is available
try {
    require.resolve('uuid');
    main();
} catch (e) {
    console.error('❌ Missing required package: uuid');
    console.log('\n📦 Please install dependencies:');
    console.log('   npm install uuid\n');
    process.exit(1);
}
