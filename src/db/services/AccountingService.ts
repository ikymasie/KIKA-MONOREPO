import { query, queryOne, execute, withTransaction, buildSetClause } from '../query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { IAccount, IJournalEntry, ILedgerTransaction, AccountStatus, AccountType, EntryType } from '../../interfaces/IAccounting';

export async function listAccounts(tenantId: string): Promise<IAccount[]> {
    const rows = await query<RowDataPacket & IAccount>(
        `SELECT a.*, p.name AS parentAccountName 
         FROM accounts a
         LEFT JOIN accounts p ON p.id = a.parentAccountId
         WHERE a.tenantId = ?
         ORDER BY a.code ASC`,
        [tenantId]
    );
    return rows;
}

export async function createAccount(tenantId: string, data: Partial<IAccount>): Promise<IAccount> {
    const id = uuidv4();
    await execute(
        `INSERT INTO accounts (id, tenantId, code, name, accountType, description, parentAccountId, balance, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
            id, tenantId, data.code, data.name, data.accountType,
            data.description ?? null, data.parentAccountId ?? null,
            data.balance ?? 0, data.status ?? AccountStatus.ACTIVE
        ]
    );

    const account = await queryOne<RowDataPacket & IAccount>('SELECT * FROM accounts WHERE id = ?', [id]);
    if (!account) throw new Error('Failed to create account');
    return account;
}

export async function updateAccount(id: string, tenantId: string, data: Partial<IAccount>): Promise<IAccount> {
    const { clause, values } = buildSetClause(data);
    if (!clause) throw new Error('No fields provided to update');

    await execute(
        `UPDATE accounts SET ${clause}, updatedAt = NOW() WHERE id = ? AND tenantId = ?`,
        [...values, id, tenantId]
    );

    const account = await queryOne<RowDataPacket & IAccount>('SELECT * FROM accounts WHERE id = ?', [id]);
    if (!account) throw new Error('Failed to update account');
    return account;
}

export async function getGeneralLedger(tenantId: string, startDate?: string, endDate?: string, accountId?: string): Promise<IJournalEntry[]> {
    let sql = `
        SELECT je.*, a.code AS accountCode, a.name AS accountName, t.transactionDate, t.referenceNumber
        FROM journal_entries je
        INNER JOIN accounts a ON a.id = je.accountId
        INNER JOIN transactions t ON t.id = je.transactionId
        WHERE a.tenantId = ? AND t.status = 'posted'
    `;
    const params: any[] = [tenantId];

    if (accountId) {
        sql += ` AND je.accountId = ?`;
        params.push(accountId);
    }
    if (startDate) {
        sql += ` AND t.transactionDate >= ?`;
        params.push(startDate);
    }
    if (endDate) {
        sql += ` AND t.transactionDate <= ?`;
        params.push(endDate);
    }

    sql += ` ORDER BY t.transactionDate DESC, je.createdAt DESC`;

    return await query<RowDataPacket & IJournalEntry>(sql, params);
}

export async function getTrialBalance(tenantId: string, asOfDate?: string): Promise<{ accounts: any[]; totalDebit: number; totalCredit: number }> {
    let sql = `
        SELECT 
            a.id, a.code, a.name, a.accountType,
            COALESCE(SUM(CASE WHEN je.entryType = 'debit' THEN je.amount ELSE 0 END), 0) AS totalDebit,
            COALESCE(SUM(CASE WHEN je.entryType = 'credit' THEN je.amount ELSE 0 END), 0) AS totalCredit
        FROM accounts a
        LEFT JOIN journal_entries je ON je.accountId = a.id
        LEFT JOIN transactions t ON t.id = je.transactionId AND t.status = 'posted'
        WHERE a.tenantId = ? AND a.status = 'active'
    `;
    const params: any[] = [tenantId];

    if (asOfDate) {
        sql += ` AND t.transactionDate <= ?`;
        params.push(asOfDate);
    }

    sql += ` GROUP BY a.id, a.code, a.name, a.accountType ORDER BY a.code ASC`;

    const rows = await query<RowDataPacket>(sql, params);

    let totalDebit = 0;
    let totalCredit = 0;

    const mapped = rows.map(r => {
        const d = Number(r.totalDebit);
        const c = Number(r.totalCredit);

        let netDebit = 0;
        let netCredit = 0;

        if (['asset', 'expense'].includes(r.accountType)) {
            const bal = d - c;
            if (bal > 0) netDebit = bal; else netCredit = Math.abs(bal);
        } else {
            const bal = c - d;
            if (bal > 0) netCredit = bal; else netDebit = Math.abs(bal);
        }

        totalDebit += netDebit;
        totalCredit += netCredit;

        return {
            ...r,
            totalDebit: netDebit,
            totalCredit: netCredit
        };
    });

    return { accounts: mapped, totalDebit, totalCredit };
}

export async function getOrCreateAccountSQL(tenantId: string, code: string, name: string, type: AccountType): Promise<IAccount> {
    let account: IAccount | null = await queryOne<RowDataPacket & IAccount>('SELECT * FROM accounts WHERE tenantId = ? AND code = ? LIMIT 1', [tenantId, code]);
    if (!account) {
        account = await createAccount(tenantId, { code, name, accountType: type, status: AccountStatus.ACTIVE, balance: 0 });
    }
    return account;
}

export async function initializeChartOfAccounts(tenantId: string) {
    const defaults = [
        { code: '1000', name: 'Cash at Bank', type: AccountType.ASSET },
        { code: '1100', name: 'Loan Portfolio', type: AccountType.ASSET },
        { code: '1200', name: 'Inventory', type: AccountType.ASSET },
        { code: '2000', name: 'Member Savings', type: AccountType.LIABILITY },
        { code: '2100', name: 'Insurance Premiums Payable', type: AccountType.LIABILITY },
        { code: '2200', name: 'Accounts Payable', type: AccountType.LIABILITY },
        { code: '3000', name: 'Retained Earnings', type: AccountType.EQUITY },
        { code: '4000', name: 'Interest Income', type: AccountType.REVENUE },
        { code: '4100', name: 'Commission Income', type: AccountType.REVENUE },
        { code: '4200', name: 'Trading Income', type: AccountType.REVENUE },
        { code: '5000', name: 'Operating Expenses', type: AccountType.EXPENSE },
    ];

    for (const def of defaults) {
        await getOrCreateAccountSQL(tenantId, def.code, def.name, def.type);
    }
}

export async function getFinancialStatement(tenantId: string, type: 'balance-sheet' | 'income-statement') {
    const accounts = await listAccounts(tenantId);

    if (type === 'balance-sheet') {
        const assets = accounts.filter(a => a.accountType === AccountType.ASSET);
        const liabilities = accounts.filter(a => a.accountType === AccountType.LIABILITY);
        const equity = accounts.filter(a => a.accountType === AccountType.EQUITY);

        return {
            assets: assets.map(a => ({ name: a.name, balance: Number(a.balance) })),
            liabilities: liabilities.map(a => ({ name: a.name, balance: Number(a.balance) })),
            equity: equity.map(a => ({ name: a.name, balance: Number(a.balance) })),
            totalAssets: assets.reduce((sum, a) => sum + Number(a.balance), 0),
            totalLiabilities: liabilities.reduce((sum, a) => sum + Number(a.balance), 0),
            totalEquity: equity.reduce((sum, a) => sum + Number(a.balance), 0)
        };
    } else {
        const revenue = accounts.filter(a => a.accountType === AccountType.REVENUE);
        const expenses = accounts.filter(a => a.accountType === AccountType.EXPENSE);

        return {
            revenue: revenue.map(a => ({ name: a.name, balance: Number(a.balance) })),
            expenses: expenses.map(a => ({ name: a.name, balance: Number(a.balance) })),
            totalRevenue: revenue.reduce((sum, a) => sum + Number(a.balance), 0),
            totalExpenses: expenses.reduce((sum, a) => sum + Number(a.balance), 0),
            netIncome: revenue.reduce((sum, a) => sum + Number(a.balance), 0) - expenses.reduce((sum, a) => sum + Number(a.balance), 0)
        };
    }
}

export async function createManualJournalEntry(
    tenantId: string,
    description: string,
    date: Date,
    items: { accountId: string; type: EntryType; amount: number; description?: string }[]
) {
    const totalDebit = items.filter(i => i.type === EntryType.DEBIT).reduce((sum, i) => sum + Number(i.amount), 0);
    const totalCredit = items.filter(i => i.type === EntryType.CREDIT).reduce((sum, i) => sum + Number(i.amount), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('Journal entry must be balanced (Debits must equal Credits)');
    }

    return await withTransaction(async (conn) => {
        const transId = uuidv4();
        await conn.query(
            `INSERT INTO transactions (id, tenantId, transactionType, transactionNumber, transactionDate, amount, description, status, createdAt, updatedAt)
             VALUES (?, ?, 'adjustment', ?, ?, ?, ?, 'posted', NOW(), NOW())`,
            [transId, tenantId, `MANUAL-${Date.now()}`, date, totalDebit, description]
        );

        for (const item of items) {
            const entryId = uuidv4();
            await conn.query(
                `INSERT INTO journal_entries(id, transactionId, accountId, entryType, amount, description, createdAt)
                 VALUES(?, ?, ?, ?, ?, ?, NOW())`,
                [entryId, transId, item.accountId, item.type, item.amount, item.description ?? description]
            );

            const [accRows] = await conn.query('SELECT accountType, balance FROM accounts WHERE id = ?', [item.accountId]) as any;
            if (accRows.length > 0) {
                const acc = accRows[0];
                const amt = Number(item.amount);
                const isDebit = item.type === EntryType.DEBIT;
                const increasesOnDebit = ['asset', 'expense'].includes(acc.accountType);

                let newBalance = Number(acc.balance);
                if (isDebit === increasesOnDebit) newBalance += amt;
                else newBalance -= amt;

                await conn.query('UPDATE accounts SET balance = ?, updatedAt = NOW() WHERE id = ?', [newBalance, item.accountId]);
            }
        }

        return true;
    });
}

export async function processVendorPayment(tenantId: string, vendorId: string, amount: number, description: string) {
    const vendor = await queryOne('SELECT name FROM vendors WHERE id = ? AND tenantId = ?', [vendorId, tenantId]);
    if (!vendor) throw new Error('Vendor not found');

    const cashAcc = await getOrCreateAccountSQL(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
    const apAcc = await getOrCreateAccountSQL(tenantId, '2200', 'Accounts Payable', AccountType.LIABILITY);

    return await createManualJournalEntry(
        tenantId,
        `Payment to ${vendor.name}: ${description}`,
        new Date(),
        [
            { accountId: apAcc.id, type: EntryType.DEBIT, amount },
            { accountId: cashAcc.id, type: EntryType.CREDIT, amount }
        ]
    );
}

export async function processInsurancePayout(tenantId: string, policyId: string, amount: number, description: string) {
    const policy = await queryOne(`
        SELECT ip.id, m.firstName, m.lastName 
        FROM insurance_policies ip
        INNER JOIN members m ON m.id = ip.memberId
        WHERE ip.id = ? AND ip.tenantId = ?
    `, [policyId, tenantId]);
    if (!policy) throw new Error('Policy not found');

    const cashAcc = await getOrCreateAccountSQL(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
    const insPayableAcc = await getOrCreateAccountSQL(tenantId, '2100', 'Insurance Premiums Payable', AccountType.LIABILITY);

    return await createManualJournalEntry(
        tenantId,
        `Insurance payout for ${policy.firstName} ${policy.lastName}: ${description}`,
        new Date(),
        [
            { accountId: insPayableAcc.id, type: EntryType.DEBIT, amount },
            { accountId: cashAcc.id, type: EntryType.CREDIT, amount }
        ]
    );
}
