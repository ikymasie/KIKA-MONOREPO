#!/usr/bin/env ts-node
/**
 * KIKA Comprehensive Demo Data Seeder
 * All column names verified against live DB via SHOW COLUMNS.
 *
 * Run: npx ts-node --project tsconfig.scripts.json scripts/seed-comprehensive.ts
 */

import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

const DB: mysql.ConnectionOptions = {
    host: process.env.DATABASE_HOST || '34.63.62.50',
    port: Number(process.env.DATABASE_PORT) || 3306,
    user: process.env.DATABASE_USERNAME || 'kika-admin',
    password: process.env.DATABASE_PASSWORD || 'Kika@2026',
    database: process.env.DATABASE_NAME || 'kikadb',
    ssl: { rejectUnauthorized: false },
};

const MONTHS = 30;
const BATCH = 500;
const MPTEN = [500, 200, 200, 100, 100];

const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const rf = (a: number, b: number) => parseFloat((Math.random() * (b - a) + a).toFixed(2));
const pk = <T>(a: T[]): T => a[ri(0, a.length - 1)];
const pkN = <T>(a: T[], n: number): T[] => [...a].sort(() => 0.5 - Math.random()).slice(0, Math.min(n, a.length));
const uid = () => uuidv4();
const fd = (d: Date) => d.toISOString().split('T')[0];
const ft = (d: Date) => d.toISOString().replace('T', ' ').split('.')[0];
const am = (d: Date, m: number): Date => { const r = new Date(d); r.setMonth(r.getMonth() + m); return r; };
const rd = (a: Date, b: Date): Date => new Date(a.getTime() + Math.random() * (b.getTime() - a.getTime()));

const FN = ['Thabo', 'Mpho', 'Kgosi', 'Lesego', 'Keabetswe', 'Tshepo', 'Neo', 'Lorato', 'Kagiso', 'Tebogo', 'Boitumelo', 'Kitso', 'Onalenna', 'Refilwe', 'Tumelo', 'Katlego', 'Lebogang', 'Mothusi', 'Gorata', 'Phenyo', 'Keitumetse', 'Amogelang', 'Masego', 'Naledi', 'Oarabile', 'Pelonomi', 'Reatile', 'Warona', 'Yaone', 'Boago', 'Dineo', 'Gofaone', 'Dimpho', 'Kabelo', 'Kelebogile', 'Mompati', 'Nthabiseng', 'Otsile', 'Seabelo', 'Tlotlo', 'Wame'];
const LN = ['Molefe', 'Kgalemang', 'Moeti', 'Seretse', 'Gaborone', 'Tshwane', 'Modise', 'Mogapi', 'Kgosana', 'Mmusi', 'Kebonang', 'Marumo', 'Setlhare', 'Tiro', 'Motlhanka', 'Kebaabetswe', 'Mogorosi', 'Ramotswa', 'Segwagwa', 'Tlhagale', 'Kedikilwe', 'Mosweu', 'Nkwe', 'Raditladi', 'Seboni', 'Tawana', 'Ntshingila', 'Masisi', 'Lekorwe', 'Kgomanyane', 'Gabanaone', 'Diaho', 'Seitiso'];
const LOCS = ['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Serowe', 'Palapye', 'Molepolole', 'Kanye', 'Mochudi', 'Lobatse', 'Selibe Phikwe', 'Jwaneng'];
const BANKS = ['First National Bank', 'Barclays Bank', 'Standard Chartered', 'Stanbic Bank', 'Bank Gaborone'];
const EMPLS = ['Ministry of Education', 'Ministry of Health', 'Gaborone City Council', 'BDF', 'Botswana Police Service', 'Botswana Railways', 'Air Botswana', 'Water Utilities Corp', 'DPSM', 'Ministry of Finance'];
const PURPS = ['Home renovation', 'Medical expenses', 'Education fees', 'Vehicle purchase', 'Business expansion', 'Debt consolidation', 'Holiday travel', 'Wedding expenses', 'Solar installation', 'Farm equipment'];

const fn = () => pk(FN);
const ln = () => pk(LN);
const loc = () => pk(LOCS);
const ph = () => `267${pk(['71', '72', '73', '74', '75', '76', '77'])}${ri(100000, 999999)}`;
const nid = () => String(ri(100000000, 999999999));
const enm = () => `EMP${ri(10000, 99999)}`;

async function ins(c: mysql.Connection, tbl: string, cols: string[], rows: unknown[][]): Promise<void> {
    if (!rows.length) return;
    const cl = cols.join(',');
    for (let i = 0; i < rows.length; i += BATCH) {
        const b = rows.slice(i, i + BATCH);
        const ph = b.map(() => `(${cols.map(() => '?').join(',')})`).join(',');
        await c.execute(`INSERT INTO \`${tbl}\` (${cl}) VALUES ${ph}`, b.flat());
    }
}

async function seed() {
    console.log('🚀  KIKA Comprehensive Seeder starting…\n');
    const conn = await mysql.createConnection(DB);
    const NOW = new Date('2026-02-21T13:00:00Z');

    try {
        await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
        await conn.execute('SET autocommit = 0');

        // ═══════════════════════════════ PHASE 1: TENANTS & USERS ═══════════════
        console.log('📦  Phase 1: Tenants & Users…');
        type TT = { id: string; code: string; name: string };
        const tenants: TT[] = [];
        for (const c of [
            { name: 'Botswana Government Employees SACCOS', code: 'BGES', ml: 500000, p: '#0ea5e9', s: '#d946ef' },
            { name: 'Teachers SACCOS', code: 'TSAC', ml: 300000, p: '#10b981', s: '#f59e0b' },
            { name: 'Police Officers SACCOS', code: 'PSAC', ml: 350000, p: '#3b82f6', s: '#ef4444' },
            { name: 'Healthcare Workers SACCOS', code: 'HWSAC', ml: 250000, p: '#8b5cf6', s: '#ec4899' },
            { name: 'Gaborone City Council SACCOS', code: 'GCCSAC', ml: 200000, p: '#f97316', s: '#06b6d4' },
        ]) tenants.push({ id: uid(), code: c.code, name: c.name });

        await ins(conn, 'tenants',
            ['id', 'name', 'code', 'status', 'registrationNumber', 'registrationDate', 'address', 'phone', 'email',
                'maxBorrowingLimit', 'maxDeductionPercentage', 'liquidityRatioTarget', 'primaryColor', 'secondaryColor',
                'currentComplianceScore', 'complianceRating', 'lastComplianceReviewDate', 'regulatorDeductionCap',
                'kycConfiguration', 'createdAt', 'updatedAt'],
            tenants.map((t, i) => {
                const cfg = [{ ml: 500000, p: '#0ea5e9' }, { ml: 300000, p: '#10b981' }, { ml: 350000, p: '#3b82f6' }, { ml: 250000, p: '#8b5cf6' }, { ml: 200000, p: '#f97316' }];
                const sec = [{ s: '#d946ef' }, { s: '#f59e0b' }, { s: '#ef4444' }, { s: '#ec4899' }, { s: '#06b6d4' }];
                return [t.id, t.name, t.code, 'active',
                `REG-${ri(2015, 2022)}-${String(ri(1, 999)).padStart(3, '0')}`,
                fd(rd(new Date('2017-01-01'), new Date('2022-01-01'))),
                `Plot ${ri(1000, 9999)}, ${loc()}`, ph(), `info@${t.code.toLowerCase()}.co.bw`,
                cfg[i].ml, 40.00, 10.00, cfg[i].p, sec[i].s,
                rf(75, 95), 'good', ft(NOW), null, null, ft(NOW), ft(NOW)];
            })
        );

        type UU = { id: string; tenantId: string | null; role: string };
        const users: UU[] = [];
        const uRows: unknown[][] = [];
        for (const { role, n } of [
            { role: 'dcd_director', n: 2 }, { role: 'dcd_field_officer', n: 5 }, { role: 'dcd_compliance_officer', n: 3 },
            { role: 'bob_prudential_supervisor', n: 2 }, { role: 'deduction_officer', n: 3 }, { role: 'registrar', n: 1 },
            { role: 'registry_clerk', n: 2 }, { role: 'legal_officer', n: 2 },
        ]) for (let i = 0; i < n; i++) {
            const id = uid(); const f = fn(); const l = ln();
            users.push({ id, tenantId: null, role });
            uRows.push([id, `${f.toLowerCase()}.${l.toLowerCase()}${i}@gov.bw`, null, f, l, role, 'active', ph(), 0, null, null, null, null, null, 0, null, ft(NOW), ft(NOW)]);
        }
        for (const t of tenants) {
            for (const { role, n } of [{ role: 'saccos_admin', n: 2 }, { role: 'loan_officer', n: 3 }, { role: 'accountant', n: 2 }, { role: 'member_service_rep', n: 2 }, { role: 'credit_committee', n: 5 }]) {
                for (let i = 0; i < n; i++) {
                    const id = uid(); const f = fn(); const l = ln();
                    users.push({ id, tenantId: t.id, role });
                    uRows.push([id, `${f.toLowerCase()}.${l.toLowerCase()}${i}@${t.code.toLowerCase()}.co.bw`, null, f, l, role, 'active', ph(), 0, null, t.id, null, null, null, 0, null, ft(NOW), ft(NOW)]);
                }
            }
        }
        await ins(conn, 'users', ['id', 'email', 'firebaseUid', 'firstName', 'lastName', 'role', 'status', 'phone', 'mfaEnabled', 'mfaSecret', 'tenantId', 'lastLoginAt', 'permissions', 'notificationPreferences', 'mustChangePassword', 'passwordChangedAt', 'createdAt', 'updatedAt'], uRows);
        const tAdm: Record<string, string> = {}, tLO: Record<string, string> = {};
        const dedOff = users.find(u => u.role === 'deduction_officer')?.id ?? null;
        for (const u of users) { if (!u.tenantId) continue; if (u.role === 'saccos_admin' && !tAdm[u.tenantId]) tAdm[u.tenantId] = u.id; if (u.role === 'loan_officer' && !tLO[u.tenantId]) tLO[u.tenantId] = u.id; }
        console.log(`   → ${tenants.length} tenants, ${users.length} users`);

        // ═══════════════════════════════ PHASE 2: ACCOUNTS ══════════════════════
        console.log('📒  Phase 2: Chart of Accounts…');
        type AC = { id: string; tenantId: string; code: string };
        const accts: AC[] = [];
        const acDefs = [{ code: '1001', name: 'Cash and Bank', t: 'asset' }, { code: '1100', name: 'Loans Receivable', t: 'asset' }, { code: '1200', name: 'Savings Receivable', t: 'asset' }, { code: '1300', name: 'Deductions Receivable', t: 'asset' }, { code: '1400', name: 'Insurance Premiums Receivable', t: 'asset' }, { code: '2001', name: 'Member Savings Deposits', t: 'liability' }, { code: '2100', name: 'Insurance Fund', t: 'liability' }, { code: '3001', name: 'Share Capital', t: 'equity' }, { code: '4001', name: 'Loan Interest Revenue', t: 'revenue' }, { code: '4200', name: 'Insurance Premium Revenue', t: 'revenue' }, { code: '5100', name: 'Loan Book', t: 'asset' }];
        const acRows: unknown[][] = [];
        for (const t of tenants) for (const d of acDefs) {
            const id = uid(); accts.push({ id, tenantId: t.id, code: d.code });
            acRows.push([id, t.id, d.code, d.name, d.t, `${d.name} — ${t.name}`, null, 0, 'active', ft(NOW), ft(NOW)]);
        }
        await ins(conn, 'accounts', ['id', 'tenantId', 'code', 'name', 'accountType', 'description', 'parentAccountId', 'balance', 'status', 'createdAt', 'updatedAt'], acRows);
        const ga = (tid: string, code: string) => accts.find(a => a.tenantId === tid && a.code === code)?.id ?? '';
        console.log(`   → ${acRows.length} accounts`);

        // ═══════════════════════════════ PHASE 3: PRODUCTS ══════════════════════
        console.log('🛍️   Phase 3: Products…');

        // savings_products — verified columns: minimumBalance, maximumBalance, status, allowWithdrawals, minMonthlyContribution
        type NullNum = number | null;
        type SP = { id: string; tenantId: string; minBal: number; rate: number };
        const sProds: SP[] = [];
        const spDefs: { name: string; code: string; rate: number; min: number; max: NullNum; mcn: number }[] = [
            { name: 'Regular Savings', code: 'REG-SAV', rate: 5, min: 100, max: null, mcn: 200 },
            { name: 'Fixed Deposit', code: 'FIX-DEP', rate: 8.5, min: 5000, max: null, mcn: 500 },
            { name: 'Holiday Savings', code: 'HOL-SAV', rate: 6, min: 50, max: 20000, mcn: 100 },
            { name: 'Education Savings', code: 'EDU-SAV', rate: 6.5, min: 100, max: 50000, mcn: 150 },
            { name: 'Emergency Fund', code: 'EMG-SAV', rate: 4.5, min: 200, max: 30000, mcn: 100 },
        ];
        const spRows: unknown[][] = [];
        for (const t of tenants) for (const d of spDefs) {
            const id = uid(); sProds.push({ id, tenantId: t.id, minBal: d.min, rate: d.rate });
            spRows.push([id, t.id, d.name, d.code, `${d.name} — ${t.name}`, d.rate, d.min, d.max, 0, 1, 'active', ft(NOW), ft(NOW), d.mcn, null, 0, null]);
        }
        await ins(conn, 'savings_products', ['id', 'tenantId', 'name', 'code', 'description', 'interestRate', 'minimumBalance', 'maximumBalance', 'isShareCapital', 'allowWithdrawals', 'status', 'createdAt', 'updatedAt', 'minMonthlyContribution', 'withdrawalRestrictions', 'interestEarningThreshold', 'flyerUrl'], spRows);

        // loan_products — verified columns: minimumAmount, maximumAmount, minimumTermMonths, maximumTermMonths, requiredGuarantors, status
        type LP = { id: string; tenantId: string; rate: number; min: number; max: number; minT: number; maxT: number; fee: number };
        const lProds: LP[] = [];
        const lpDefs = [{ name: 'Emergency Loan', code: 'EMG-LOAN', rate: 12, min: 1000, max: 20000, minT: 3, maxT: 12, fee: 2 }, { name: 'Development Loan', code: 'DEV-LOAN', rate: 10, min: 10000, max: 100000, minT: 12, maxT: 36, fee: 2.5 }, { name: 'Mortgage Loan', code: 'MTG-LOAN', rate: 8.5, min: 50000, max: 500000, minT: 60, maxT: 240, fee: 1.5 }, { name: 'Education Loan', code: 'EDU-LOAN', rate: 9, min: 5000, max: 80000, minT: 12, maxT: 48, fee: 2 }, { name: 'Vehicle Loan', code: 'VEH-LOAN', rate: 11, min: 30000, max: 300000, minT: 24, maxT: 60, fee: 2.5 }, { name: 'Business Loan', code: 'BUS-LOAN', rate: 13, min: 20000, max: 200000, minT: 12, maxT: 60, fee: 3 }, { name: 'Debt Consolidation', code: 'DEB-LOAN', rate: 11.5, min: 15000, max: 150000, minT: 12, maxT: 48, fee: 2 }, { name: 'Agricultural Loan', code: 'AGR-LOAN', rate: 9.5, min: 10000, max: 120000, minT: 12, maxT: 36, fee: 2 }];
        const lpRows: unknown[][] = [];
        for (const t of tenants) for (const d of lpDefs) {
            const id = uid(); lProds.push({ id, tenantId: t.id, rate: d.rate, min: d.min, max: d.max, minT: d.minT, maxT: d.maxT, fee: d.fee });
            lpRows.push([id, t.id, d.name, d.code, `${d.name} — ${t.name}`, d.rate, 'reducing_balance', d.min, d.max, d.minT, d.maxT, 2, d.fee, null, 0, null, 'active', ft(NOW), ft(NOW), 3, d.maxT, 0, null]);
        }
        await ins(conn, 'loan_products', ['id', 'tenantId', 'name', 'code', 'description', 'interestRate', 'interestMethod', 'minimumAmount', 'maximumAmount', 'minimumTermMonths', 'maximumTermMonths', 'requiredGuarantors', 'processingFeePercentage', 'insuranceFeePercentage', 'requiresCollateral', 'penaltyRate', 'status', 'createdAt', 'updatedAt', 'savingsMultiplier', 'maxDurationMonths', 'gracePeriodDays', 'flyerUrl'], lpRows);

        // insurance_products — verified: monthlyPremium, coverageAmount, coverageType(individual|family|extended), status
        type IP = { id: string; tenantId: string; premium: number; cov: number; waitMo: number };
        const iProds: IP[] = [];
        const ipDefs = [{ name: 'Life Insurance', code: 'LIFE-INS', ctype: 'individual', cov: 200000, prem: 150, wait: 6 }, { name: 'Funeral Cover', code: 'FUN-INS', ctype: 'family', cov: 30000, prem: 50, wait: 3 }, { name: 'Disability Insurance', code: 'DIS-INS', ctype: 'individual', cov: 150000, prem: 120, wait: 6 }, { name: 'Critical Illness', code: 'CRI-INS', ctype: 'individual', cov: 200000, prem: 180, wait: 12 }, { name: 'Family Protection', code: 'FAM-INS', ctype: 'family', cov: 500000, prem: 250, wait: 6 }];
        const ipRows: unknown[][] = [];
        for (const t of tenants) for (const d of ipDefs) {
            const id = uid(); iProds.push({ id, tenantId: t.id, premium: d.prem, cov: d.cov, waitMo: d.wait });
            ipRows.push([id, t.id, d.name, d.code, `${d.name} — ${t.name}`, d.ctype, d.prem, d.cov, d.wait, null, null, null, null, 'active', ft(NOW), ft(NOW), null]);
        }
        await ins(conn, 'insurance_products', ['id', 'tenantId', 'name', 'code', 'description', 'coverageType', 'monthlyPremium', 'coverageAmount', 'waitingPeriodMonths', 'maxDependents', 'maxDependentAge', 'underwriter', 'policyNumber', 'status', 'createdAt', 'updatedAt', 'flyerUrl'], ipRows);
        console.log(`   → ${sProds.length} savings, ${lProds.length} loan, ${iProds.length} insurance products`);

        // ═══════════════════════════════ PHASE 4: MEMBERS ═══════════════════════
        console.log('👥  Phase 4: Members & related data…');
        type MM = { id: string; tenantId: string; mn: string; sal: number; jd: Date; status: string };
        const members: MM[] = [];
        const mRows: unknown[][] = [];
        const kycRows: unknown[][] = [];
        const benRows: unknown[][] = [];
        const depRows: unknown[][] = [];
        const baRows: unknown[][] = [];
        const msRows: unknown[][] = [];

        for (let ti = 0; ti < tenants.length; ti++) {
            const t = tenants[ti]; const cnt = MPTEN[ti];
            const tSP = sProds.filter(p => p.tenantId === t.id);
            for (let i = 0; i < cnt; i++) {
                const id = uid(); const f = fn(); const l = ln();
                const mn = `${t.code}-${String(i + 1).padStart(5, '0')}`;
                const jd = rd(new Date('2019-01-01'), new Date('2024-06-30'));
                const dob = rd(new Date('1960-01-01'), new Date('2000-12-31'));
                const st = pk(['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'inactive', 'suspended']);
                const emp = pk(['employed', 'employed', 'employed', 'employed', 'self_employed', 'unemployed']);
                const sal = rf(3000, 30000);
                const email = `${f.toLowerCase()}.${l.toLowerCase()}.${ti}.${i}@email.co.bw`;
                members.push({ id, tenantId: t.id, mn, sal, jd, status: st });
                mRows.push([id, null, t.id, mn, f, l, null, nid(), null, fd(dob), pk(['male', 'female']), email, ph(), `Plot ${ri(1000, 9999)}, ${loc()}`, `P.O. Box ${ri(100, 9999)}, ${loc()}`, st, emp, emp === 'employed' ? pk(EMPLS) : null, emp === 'employed' ? enm() : null, rf(1000, 50000), sal, fd(jd), null, null, ft(jd), ft(NOW)]);

                // kyc — exact: id,memberId,proofOfIdentityUrl,proofOfResidenceUrl,proofOfIncomeUrl,bankStatementUrl,identityVerified,residenceVerified,incomeVerified,verifiedBy,verifiedAt,notes,createdAt,updatedAt
                const kv = pk(['verified', 'verified', 'verified', 'verified', 'pending', 'rejected']);
                kycRows.push([uid(), id, null, null, null, null, kv === 'verified' ? 1 : 0, kv === 'verified' ? 1 : 0, kv === 'verified' ? 1 : 0, null, kv === 'verified' ? ft(rd(jd, NOW)) : null, null, ft(NOW), ft(NOW)]);

                // beneficiaries — exact: id,memberId,firstName,lastName,relationship,dateOfBirth,nationalId,phone,address,allocationPercentage,createdAt,updatedAt
                const bc = ri(2, 4); const pct = parseFloat((100 / bc).toFixed(2));
                for (let j = 0; j < bc; j++) {
                    const rel = pk(['spouse', 'child', 'parent', 'sibling', 'other']);
                    benRows.push([uid(), id, fn(), ln(), rel, fd(rd(new Date('1960-01-01'), new Date('2005-12-31'))), nid(), ph(), null, pct, ft(NOW), ft(NOW)]);
                }

                // dependents — exact: id,memberId,firstName,lastName,relationship,dateOfBirth,nationalId,gender,isActive,createdAt,updatedAt
                for (let j = 0; j < ri(0, 3); j++) {
                    depRows.push([uid(), id, fn(), ln(), pk(['spouse', 'child', 'extended_family']), fd(rd(new Date('1995-01-01'), new Date('2022-12-31'))), nid(), pk(['male', 'female']), 1, ft(NOW), ft(NOW)]);
                }

                // member_bank_accounts — exact: id,memberId,bankName,branchCode,accountNumber,accountHolderName,accountType,isPrimary,isActive,notes,createdAt,updatedAt
                for (let j = 0; j < ri(1, 2); j++) {
                    baRows.push([uid(), id, pk(BANKS), String(ri(1000, 9999)), String(ri(1000000000, 9999999999)), `${f} ${l}`, pk(['savings', 'current', 'cheque']), j === 0 ? 1 : 0, 1, null, ft(NOW), ft(NOW)]);
                }

                // member_savings — exact verified: id,memberId,productId,balance,monthlyContribution,isActive,createdAt,updatedAt
                for (const p of pkN(tSP, ri(1, 3))) msRows.push([uid(), id, p.id, rf(p.minBal, p.minBal * 20), rf(200, 1500), 1, ft(jd), ft(NOW)]);
            }
        }

        await ins(conn, 'members', ['id', 'userId', 'tenantId', 'memberNumber', 'firstName', 'lastName', 'middleName', 'nationalId', 'passportNumber', 'dateOfBirth', 'gender', 'email', 'phone', 'physicalAddress', 'postalAddress', 'status', 'employmentStatus', 'employer', 'employeeNumber', 'shareCapital', 'monthlyNetSalary', 'joinDate', 'exitDate', 'exitReason', 'createdAt', 'updatedAt'], mRows);
        await ins(conn, 'kyc', ['id', 'memberId', 'proofOfIdentityUrl', 'proofOfResidenceUrl', 'proofOfIncomeUrl', 'bankStatementUrl', 'identityVerified', 'residenceVerified', 'incomeVerified', 'verifiedBy', 'verifiedAt', 'notes', 'createdAt', 'updatedAt'], kycRows);
        await ins(conn, 'beneficiaries', ['id', 'memberId', 'firstName', 'lastName', 'relationship', 'dateOfBirth', 'nationalId', 'phone', 'address', 'allocationPercentage', 'createdAt', 'updatedAt'], benRows);
        await ins(conn, 'dependents', ['id', 'memberId', 'firstName', 'lastName', 'relationship', 'dateOfBirth', 'nationalId', 'gender', 'isActive', 'createdAt', 'updatedAt'], depRows);
        await ins(conn, 'member_bank_accounts', ['id', 'memberId', 'bankName', 'branchCode', 'accountNumber', 'accountHolderName', 'accountType', 'isPrimary', 'isActive', 'notes', 'createdAt', 'updatedAt'], baRows);
        await ins(conn, 'member_savings', ['id', 'memberId', 'productId', 'balance', 'monthlyContribution', 'isActive', 'createdAt', 'updatedAt'], msRows);
        console.log(`   → ${members.length} members, ${benRows.length} beneficiaries, ${depRows.length} dependents`);
        console.log(`   → ${baRows.length} bank accounts, ${msRows.length} savings accounts`);

        // ═══════════════════════════════ PHASE 5: LOANS ══════════════════════════
        console.log('💰  Phase 5: Loans…');
        type Loan = { id: string; memberId: string; tenantId: string; inst: number; prin: number; status: string; disbDate: Date | null; termMo: number };
        const loans: Loan[] = [];
        const lRows: unknown[][] = [];
        const lgRows: unknown[][] = [];
        const lStats = ['active', 'active', 'active', 'paid_off', 'paid_off', 'disbursed', 'rejected', 'defaulted'];
        let lctr = 0;

        for (const m of members) {
            const tLP = lProds.filter(p => p.tenantId === m.tenantId);
            for (let i = 0; i < ri(1, 4); i++) {
                const p = pk(tLP); const st = pk(lStats);
                const prin = rf(p.min, Math.min(p.max, m.sal * 24));
                const term = ri(p.minT, p.maxT);
                const r = p.rate / 100 / 12;
                const inst = r > 0 ? parseFloat(((prin * r * Math.pow(1 + r, term)) / (Math.pow(1 + r, term) - 1)).toFixed(2)) : parseFloat((prin / term).toFixed(2));
                const fee = parseFloat((prin * p.fee / 100).toFixed(2));
                const total = parseFloat((inst * term).toFixed(2));
                const app = rd(new Date('2020-01-01'), new Date('2024-06-01'));
                const disbDate = ['active', 'paid_off', 'disbursed', 'defaulted'].includes(st) ? am(app, 1) : null;
                const mat = disbDate ? am(disbDate, term) : null;
                let paid = 0, outs = total;
                if (st === 'paid_off') { paid = total; outs = 0; }
                else if (['active', 'defaulted'].includes(st)) { const mp = ri(1, Math.max(1, term - 1)); paid = parseFloat((inst * mp).toFixed(2)); outs = parseFloat(Math.max(0, total - paid).toFixed(2)); }
                lctr++; const lid = uid();
                const tc = tenants.find(t => t.id === m.tenantId)?.code ?? 'UNK';
                const lno = `LN-${tc}-${String(lctr).padStart(6, '0')}`;
                loans.push({ id: lid, memberId: m.id, tenantId: m.tenantId, inst, prin, status: st, disbDate, termMo: term });
                // loans table — verified (no insuranceFee col, tenantId is there): id,tenantId,loanNumber,memberId,productId,principalAmount,interestRate,termMonths,monthlyInstallment,processingFee,totalAmountDue,amountPaid,outstandingBalance,status,applicationDate,approvalDate,disbursementDate,maturityDate,approvedBy,disbursedBy,purpose,rejectionReason,createdAt,updatedAt,workflowStage,eligibilityCheckPassed,loanOfficerId,loanOfficerNotes,loanOfficerReviewDate,committeeApprovalDate,deductionScheduled,deductionScheduledAt
                lRows.push([lid, m.tenantId, lno, m.id, p.id, prin, p.rate, term, inst, fee, total, paid, outs, st, fd(app), disbDate ? fd(am(app, 0)) : null, disbDate ? fd(disbDate) : null, mat ? fd(mat) : null, tAdm[m.tenantId] ?? null, null, pk(PURPS), st === 'rejected' ? 'Does not meet eligibility criteria' : null, ft(app), ft(NOW), st !== 'rejected' ? 'committee_approval' : null, st !== 'rejected' ? 1 : 0, tLO[m.tenantId] ?? null, null, disbDate ? ft(am(app, 0)) : null, disbDate ? ft(disbDate) : null, ['active', 'paid_off', 'disbursed'].includes(st) ? 1 : 0, disbDate ? ft(disbDate) : null]);
                // guarantors
                if (['active', 'paid_off', 'disbursed'].includes(st)) {
                    const pool = members.filter(x => x.tenantId === m.tenantId && x.id !== m.id);
                    for (const g of pkN(pool, 2)) lgRows.push([uid(), lid, g.id, prin * 0.5, 'accepted', ft(app), null, null, null, null, null, 0, ft(app)]);
                }
            }
        }
        await ins(conn, 'loans', ['id', 'tenantId', 'loanNumber', 'memberId', 'productId', 'principalAmount', 'interestRate', 'termMonths', 'monthlyInstallment', 'processingFee', 'totalAmountDue', 'amountPaid', 'outstandingBalance', 'status', 'applicationDate', 'approvalDate', 'disbursementDate', 'maturityDate', 'approvedBy', 'disbursedBy', 'purpose', 'rejectionReason', 'createdAt', 'updatedAt', 'workflowStage', 'eligibilityCheckPassed', 'loanOfficerId', 'loanOfficerNotes', 'loanOfficerReviewDate', 'committeeApprovalDate', 'deductionScheduled', 'deductionScheduledAt'], lRows);
        await ins(conn, 'loan_guarantors', ['id', 'loanId', 'guarantorMemberId', 'guaranteedAmount', 'status', 'acceptedAt', 'rejectedAt', 'rejectionReason', 'pledgedSavingsId', 'pledgeAmount', 'notificationSentAt', 'notificationAttempts', 'createdAt'], lgRows);
        console.log(`   → ${loans.length} loans, ${lgRows.length} guarantors`);

        // ═══════════════════════════════ PHASE 6: INSURANCE ═════════════════════
        console.log('🛡️   Phase 6: Insurance policies & claims…');
        type Pol = { id: string; memberId: string; tenantId: string; prem: number; sDate: Date; status: string; mp: number };
        const pols: Pol[] = [];
        const polRows: unknown[][] = [];
        const clmRows: unknown[][] = [];
        let polCtr = 0, clmCtr = 0;

        for (const m of members) {
            const tIP = iProds.filter(p => p.tenantId === m.tenantId);
            for (const p of pkN(tIP, ri(1, 3))) {
                polCtr++; const pid = uid();
                const pnum = `POL-${String(polCtr).padStart(7, '0')}`;
                const sDate = rd(m.jd, am(NOW, -p.waitMo - 1));
                const wEnd = am(sDate, p.waitMo);
                const past = wEnd < NOW;
                const pst = past ? pk(['active', 'active', 'active', 'lapsed']) : 'waiting_period';
                const mp = past ? ri(p.waitMo + 1, 36) : ri(0, p.waitMo);
                const prem = rf(p.premium * 0.8, p.premium * 1.4);
                const cov = p.cov;
                pols.push({ id: pid, memberId: m.id, tenantId: m.tenantId, prem, sDate, status: pst, mp });
                // insurance_policies — verified: id,policyNumber,memberId,productId,monthlyPremium,coverageAmount,startDate,endDate,waitingPeriodEndDate,status,monthsPaid,createdAt,updatedAt
                polRows.push([pid, pnum, m.id, p.id, prem, cov, fd(sDate), null, fd(wEnd), pst, mp, ft(sDate), ft(NOW)]);

                if (pst === 'active' && Math.random() < 0.20) {
                    clmCtr++; const cd = rd(wEnd, NOW);
                    const cst = pk(['submitted', 'in_review', 'approved', 'paid', 'rejected']);
                    const appr = ['approved', 'paid'].includes(cst) ? rf(cov * 0.1, cov * 0.4) : null;
                    const ctype = pk(['death', 'disability', 'critical_illness', 'other']);
                    clmRows.push([uid(), m.tenantId, `CLM-${String(clmCtr).padStart(7, '0')}`, pid, ctype, rf(cov * 0.1, cov * 0.5), fd(cd), `${ctype.replace('_', ' ')} claim by ${m.mn}`, null, cst, null, null, null, null, null, null, null, null, null, null, 0, null, null, appr, cst === 'paid' ? ft(rd(cd, NOW)) : null, ft(cd), ft(NOW)]);
                }
            }
        }
        await ins(conn, 'insurance_policies', ['id', 'policyNumber', 'memberId', 'productId', 'monthlyPremium', 'coverageAmount', 'startDate', 'endDate', 'waitingPeriodEndDate', 'status', 'monthsPaid', 'createdAt', 'updatedAt'], polRows);
        await ins(conn, 'insurance_claims', ['id', 'tenantId', 'claimNumber', 'policyId', 'claimType', 'claimAmount', 'incidentDate', 'description', 'supportingDocuments', 'status', 'verifiedBy', 'verifiedAt', 'adjudicatedBy', 'adjudicatedAt', 'disbursedBy', 'disbursedAt', 'disputeReason', 'disputeEvidenceUrls', 'committeeReviewNotes', 'regulatorRuling', 'isExGratia', 'queryReason', 'rejectionReason', 'approvedAmount', 'paidAt', 'createdAt', 'updatedAt'], clmRows);
        console.log(`   → ${polRows.length} policies, ${clmRows.length} claims`);

        // ═══════════════════════════════ PHASE 7: DEDUCTIONS ════════════════════
        console.log('📋  Phase 7: Deductions & Reconciliation…');
        const drRows: unknown[][] = [];
        const diRows: unknown[][] = [];
        const rbRows: unknown[][] = [];
        const riRows: unknown[][] = [];
        const matchSt = ['matched', 'matched', 'matched', 'matched', 'matched', 'matched', 'matched', 'matched', 'variance', 'missing_in_mof'];
        const varRe = ['insufficient_funds', 'member_terminated', 'net_pay_too_low', 'amount_mismatch'];
        const h0 = new Date('2023-01-01');

        for (const t of tenants) {
            const tm = members.filter(m => m.tenantId === t.id);
            const adm = tAdm[t.id] ?? null;
            for (let mo = 0; mo < MONTHS; mo++) {
                const pd = am(h0, mo); const mo2 = pd.getMonth() + 1; const yr = pd.getFullYear();
                const done = pd < am(NOW, -1);
                const bnum = `DED-${t.code}-${yr}${String(mo2).padStart(2, '0')}`;
                const drId = uid();
                const elig = tm.filter(m => m.status === 'active' && m.jd <= pd);
                if (!elig.length) continue;
                let btot = 0;
                const bdi: unknown[][] = [];
                const bri: unknown[][] = [];
                for (const m of elig) {
                    const sv = rf(200, 800);
                    const lr = loans.filter(l => l.memberId === m.id && l.status === 'active').reduce((s, l) => s + l.inst, 0);
                    const ins2 = rf(50, 300);
                    const cur = parseFloat((sv + lr + ins2).toFixed(2));
                    const prev = parseFloat((cur * rf(0.95, 1.05)).toFixed(2));
                    btot += cur;
                    bdi.push([uid(), drId, m.id, m.mn, nid(), enm(), cur, prev, 'new_enrollment', JSON.stringify({ savings: sv, loanRepayment: parseFloat(lr.toFixed(2)), insurance: ins2 }), 0, null, ft(pd)]);
                    if (done) {
                        const ms = pk(matchSt);
                        const act = ms === 'matched' ? cur : ms === 'variance' ? parseFloat((cur * rf(0.7, 0.99)).toFixed(2)) : 0;
                        bri.push([uid(), null, m.id, m.mn, nid(), enm(), cur, cur, act, parseFloat((cur - act).toFixed(2)), ms, ms !== 'matched' ? pk(varRe) : null, ms !== 'matched' ? `Variance ${yr}-${mo2}` : null, ms !== 'matched' ? 1 : 0, done ? 1 : 0, ft(pd)]);
                    }
                }
                diRows.push(...bdi);
                drRows.push([drId, t.id, bnum, mo2, yr, elig.length, parseFloat(btot.toFixed(2)), done ? 'completed' : pk(['submitted', 'processing']), null, adm, done ? ft(new Date(yr, mo2 - 1, 5)) : null, `Monthly deduction ${mo2}/${yr}`, ft(pd), ft(NOW)]);
                if (done && bri.length) {
                    const rbId = uid();
                    const matched = bri.filter(r => r[10] === 'matched').length;
                    const varct = bri.filter(r => r[10] === 'variance').length;
                    const miss = bri.filter(r => r[10] === 'missing_in_mof').length;
                    const tact = bri.reduce((s, r) => s + Number(r[8]), 0);
                    // reconciliation_batches — verified columns (no deductionRequestId in initial cols, it's last col)
                    rbRows.push([rbId, t.id, bnum, mo2, yr, null, elig.length, matched, miss, varct, parseFloat(btot.toFixed(2)), parseFloat(tact.toFixed(2)), parseFloat((btot - tact).toFixed(2)), 'completed', dedOff, ft(new Date(yr, mo2 - 1, 10)), 1, ft(pd), ft(NOW), drId]);
                    for (const r of bri) r[1] = rbId;
                    riRows.push(...bri);
                }
            }
        }
        await ins(conn, 'deduction_requests', ['id', 'tenantId', 'batchNumber', 'month', 'year', 'totalMembers', 'totalAmount', 'status', 'csvFileUrl', 'submittedBy', 'submittedAt', 'notes', 'createdAt', 'updatedAt'], drRows);
        await ins(conn, 'deduction_items', ['id', 'requestId', 'memberId', 'memberNumber', 'nationalId', 'employeeNumber', 'currentAmount', 'previousAmount', 'changeReason', 'breakdown', 'isOverLimit', 'limitNotes', 'createdAt'], diRows);
        await ins(conn, 'reconciliation_batches', ['id', 'tenantId', 'batchNumber', 'month', 'year', 'mofFileUrl', 'totalRecords', 'matchedRecords', 'unmatchedRecords', 'varianceRecords', 'totalExpected', 'totalActual', 'totalVariance', 'status', 'processedBy', 'processedAt', 'journalsPosted', 'createdAt', 'updatedAt', 'deductionRequestId'], rbRows);
        await ins(conn, 'reconciliation_items', ['id', 'batchId', 'memberId', 'memberNumber', 'nationalId', 'employeeNumber', 'expectedAmount', 'requestedAmount', 'actualAmount', 'variance', 'matchStatus', 'varianceReason', 'notes', 'requiresManualReview', 'journalPosted', 'createdAt'], riRows);
        console.log(`   → ${drRows.length} deduction requests, ${diRows.length} deduction items`);
        console.log(`   → ${rbRows.length} recon batches, ${riRows.length} recon items`);

        // ═══════════════════════════════ PHASE 8: TRANSACTIONS ══════════════════
        console.log('💳  Phase 8: Transactions & Journal Entries…');
        const txRows: unknown[][] = [];
        const jeRows: unknown[][] = [];
        let txCtr = 0;

        const addTx = (tid: string, mid: string | null, type: string, amount: number, date: Date, desc: string, refId: string, refType: string, by: string | null) => {
            txCtr++; const txId = uid();
            const dc = type === 'loan_repayment' ? '1100' : type === 'loan_disbursement' ? '5100' : type === 'deposit' ? '1200' : type === 'deduction' ? '1300' : '1400';
            const cc = type === 'loan_disbursement' ? '1001' : type === 'loan_repayment' ? '4001' : type === 'deposit' ? '2001' : type === 'deduction' ? '4200' : '2100';
            txRows.push([txId, `TXN-${String(txCtr).padStart(8, '0')}`, type, amount, fd(date), desc, mid, tid, refId, refType, 'completed', by, null, null, ft(date)]);
            jeRows.push([uid(), txId, ga(tid, dc), 'debit', amount, desc, ft(date)]);
            jeRows.push([uid(), txId, ga(tid, cc), 'credit', amount, desc, ft(date)]);
        };

        for (const dr of drRows) {
            if (dr[7] !== 'completed') continue;
            const tid = dr[1] as string; const pd = new Date(dr[12] as string);
            addTx(tid, null, 'deduction', Number(dr[6]), pd, `Batch ${dr[2]}`, dr[0] as string, 'deduction_request', tAdm[tid] ?? null);
        }
        for (const l of loans) {
            if (!['active', 'paid_off', 'disbursed'].includes(l.status) || !l.disbDate) continue;
            const adm = tAdm[l.tenantId] ?? null;
            addTx(l.tenantId, l.memberId, 'loan_disbursement', l.prin, l.disbDate, 'Loan disbursement', l.id, 'loan', adm);
            const mo2 = Math.floor((NOW.getTime() - l.disbDate.getTime()) / (30 * 24 * 3600 * 1000));
            const n = l.status === 'paid_off' ? l.termMo : Math.min(mo2, l.termMo - 1);
            for (let p = 0; p < n; p++) {
                const d = am(l.disbDate, p + 1); if (d > NOW) break;
                addTx(l.tenantId, l.memberId, 'loan_repayment', l.inst, d, `Repayment ${p + 1}/${l.termMo}`, l.id, 'loan', adm);
            }
        }
        for (const pol of pols) {
            if (!['active', 'lapsed'].includes(pol.status)) continue;
            const adm = tAdm[pol.tenantId] ?? null;
            for (let p = 0; p < pol.mp; p++) {
                const d = am(pol.sDate, p); if (d > NOW) break;
                addTx(pol.tenantId, pol.memberId, 'insurance_premium', pol.prem, d, 'Insurance premium', pol.id, 'insurance_policy', adm);
            }
        }
        for (const row of msRows) {
            const [, mid, pid, , contrib] = row as [string, string, string, number, number];
            const m = members.find(x => x.id === mid); if (!m) continue;
            const adm = tAdm[m.tenantId] ?? null; const dep = Number(contrib);
            const nmo = Math.floor((NOW.getTime() - m.jd.getTime()) / (30 * 24 * 3600 * 1000));
            for (let p = 0; p < Math.min(nmo, MONTHS); p++) {
                const d = am(m.jd, p); if (d > NOW) break;
                addTx(m.tenantId, mid, 'deposit', dep, d, 'Monthly savings contribution', pid, 'savings_product', adm);
            }
        }

        await ins(conn, 'transactions', ['id', 'transactionNumber', 'transactionType', 'amount', 'transactionDate', 'description', 'memberId', 'tenantId', 'referenceId', 'referenceType', 'status', 'createdBy', 'approvedBy', 'approvedAt', 'createdAt'], txRows);
        await ins(conn, 'journal_entries', ['id', 'transactionId', 'accountId', 'entryType', 'amount', 'description', 'createdAt'], jeRows);
        console.log(`   → ${txRows.length} transactions, ${jeRows.length} journal entries`);

        // ─── COMMIT ─────────────────────────────────────────────────────────────
        await conn.execute('COMMIT');
        await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

        // ─── SUMMARY ────────────────────────────────────────────────────────────
        const tbl: Record<string, number> = {
            tenants: tenants.length, users: users.length, accounts: acRows.length,
            members: members.length, kyc: kycRows.length, beneficiaries: benRows.length,
            dependents: depRows.length, bank_accounts: baRows.length, member_savings: msRows.length,
            savings_products: sProds.length, loan_products: lProds.length, insurance_products: iProds.length,
            loans: loans.length, loan_guarantors: lgRows.length,
            insurance_policies: polRows.length, insurance_claims: clmRows.length,
            deduction_requests: drRows.length, deduction_items: diRows.length,
            reconciliation_batches: rbRows.length, reconciliation_items: riRows.length,
            transactions: txRows.length, journal_entries: jeRows.length,
        };
        const total = Object.values(tbl).reduce((a, b) => a + b, 0);
        console.log('\n✅  Seeding complete!\n');
        console.log('📊  Final Row Counts:');
        console.log('─'.repeat(50));
        for (const [k, v] of Object.entries(tbl)) console.log(`   ${k.padEnd(32)} ${v.toLocaleString().padStart(12)}`);
        console.log('─'.repeat(50));
        console.log(`   ${'TOTAL'.padEnd(32)} ${total.toLocaleString().padStart(12)}\n`);

    } catch (err) {
        console.error('\n❌  Seeding FAILED:', err);
        try { await conn.execute('ROLLBACK'); } catch { }
        try { await conn.execute('SET FOREIGN_KEY_CHECKS = 1'); } catch { }
        throw err;
    } finally {
        await conn.end();
    }
}

seed().catch(() => process.exit(1));
