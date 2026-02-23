
import { query, queryOne, execute, withTransaction } from '../db/query';
import { RowDataPacket } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export interface ManualEntryRequest {
    tenantId: string;
    description: string;
    date: Date;
    items: {
        accountId: string;
        type: string;
        amount: number;
        description?: string;
    }[];
}

export class AccountingService {

    /**
     * Get or create a default account for a tenant
     */
    async getOrCreateAccount(tenantId: string, code: string, name: string, type: string): Promise<any> {
        let account = await queryOne<RowDataPacket & any>(
            'SELECT * FROM accounts WHERE tenantId = ? AND code = ? LIMIT 1',
            [tenantId, code]
        );
        if (!account) {
            const id = uuidv4();
            await execute(
                'INSERT INTO accounts (id, tenantId, code, name, accountType, balance, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
                [id, tenantId, code, name, type, 0, 'active']
            );
            account = await queryOne<RowDataPacket & any>('SELECT * FROM accounts WHERE id = ?', [id]);
        }
        return account;
    }

    /**
     * Initialize standard chart of accounts for a tenant
     */
    async initializeChartOfAccounts(tenantId: string) {
        const defaults = [
            { code: '1000', name: 'Cash at Bank', type: 'asset' },
            { code: '1100', name: 'Loan Portfolio', type: 'asset' },
            { code: '1200', name: 'Inventory', type: 'asset' },
            { code: '2000', name: 'Member Savings', type: 'liability' },
            { code: '2100', name: 'Insurance Premiums Payable', type: 'liability' },
            { code: '2200', name: 'Accounts Payable', type: 'liability' },
            { code: '3000', name: 'Retained Earnings', type: 'equity' },
            { code: '4000', name: 'Interest Income', type: 'revenue' },
            { code: '4100', name: 'Commission Income', type: 'revenue' },
            { code: '4200', name: 'Trading Income', type: 'revenue' },
            { code: '5000', name: 'Operating Expenses', type: 'expense' },
        ];

        for (const def of defaults) {
            await this.getOrCreateAccount(tenantId, def.code, def.name, def.type);
        }
    }

    /**
     * Process a transaction and create corresponding journal entries
     */
    async processTransaction(transactionId: string): Promise<any[]> {
        return await withTransaction(async (conn) => {
            const [[transaction]] = await conn.query('SELECT * FROM transactions WHERE id = ? LIMIT 1', [transactionId]) as any;

            if (!transaction) throw new Error('Transaction not found');
            if (!transaction.tenantId) throw new Error('Transaction must have a tenantId');

            const { tenantId, transactionType, amount, description } = transaction;
            const entries: any[] = [];

            switch (transactionType) {
                case 'deposit': {
                    const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', 'asset');
                    const savingsAcc = await this.getOrCreateAccount(tenantId, '2000', 'Member Savings', 'liability');
                    entries.push(
                        { transactionId, accountId: cashAcc.id, entryType: 'debit', amount, description },
                        { transactionId, accountId: savingsAcc.id, entryType: 'credit', amount, description }
                    );
                    break;
                }
                case 'withdrawal': {
                    const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', 'asset');
                    const savingsAcc = await this.getOrCreateAccount(tenantId, '2000', 'Member Savings', 'liability');
                    entries.push(
                        { transactionId, accountId: savingsAcc.id, entryType: 'debit', amount, description },
                        { transactionId, accountId: cashAcc.id, entryType: 'credit', amount, description }
                    );
                    break;
                }
                case 'loan_disbursement': {
                    const loanAcc = await this.getOrCreateAccount(tenantId, '1100', 'Loan Portfolio', 'asset');
                    const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', 'asset');
                    entries.push(
                        { transactionId, accountId: loanAcc.id, entryType: 'debit', amount, description },
                        { transactionId, accountId: cashAcc.id, entryType: 'credit', amount, description }
                    );
                    break;
                }
                case 'loan_repayment': {
                    const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', 'asset');
                    const loanAcc = await this.getOrCreateAccount(tenantId, '1100', 'Loan Portfolio', 'asset');
                    entries.push(
                        { transactionId, accountId: cashAcc.id, entryType: 'debit', amount, description },
                        { transactionId, accountId: loanAcc.id, entryType: 'credit', amount, description }
                    );
                    break;
                }
                case 'insurance_premium': {
                    const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', 'asset');
                    const insAcc = await this.getOrCreateAccount(tenantId, '2100', 'Insurance Premiums Payable', 'liability');
                    entries.push(
                        { transactionId, accountId: cashAcc.id, entryType: 'debit', amount, description },
                        { transactionId, accountId: insAcc.id, entryType: 'credit', amount, description }
                    );
                    break;
                }
                case 'merchandise_purchase': {
                    const invAcc = await this.getOrCreateAccount(tenantId, '1200', 'Inventory', 'asset');
                    const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', 'asset');
                    entries.push(
                        { transactionId, accountId: invAcc.id, entryType: 'debit', amount, description },
                        { transactionId, accountId: cashAcc.id, entryType: 'credit', amount, description }
                    );
                    break;
                }
            }

            if (entries.length === 0) return [];

            const savedEntries: any[] = [];
            for (const entry of entries) {
                const id = uuidv4();
                await conn.query(
                    'INSERT INTO journal_entries (id, transactionId, accountId, entryType, amount, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [id, entry.transactionId, entry.accountId, entry.entryType, entry.amount, entry.description]
                );
                const [[savedEntry]] = await conn.query('SELECT * FROM journal_entries WHERE id = ?', [id]) as any;
                savedEntries.push(savedEntry);
            }

            // Update account balances
            for (const entry of savedEntries) {
                await this.updateAccountBalanceConn(conn, entry.accountId!, entry.entryType!, Number(entry.amount));
            }

            return savedEntries;
        });
    }

    private async updateAccountBalanceConn(conn: any, accountId: string, entryType: string, amount: number) {
        const [[account]] = await conn.query('SELECT * FROM accounts WHERE id = ?', [accountId]);
        if (account) {
            const amt = Number(amount);
            const isDebit = entryType === 'debit';
            const increasesOnDebit = ['asset', 'expense'].includes(account.accountType);

            let newBalance = Number(account.balance);
            if (isDebit === increasesOnDebit) {
                newBalance += amt;
            } else {
                newBalance -= amt;
            }
            await conn.query('UPDATE accounts SET balance = ?, updatedAt = NOW() WHERE id = ?', [newBalance, accountId]);
        }
    }

    /**
     * Get General Ledger entries
     */
    async getGeneralLedger(tenantId: string, params: { startDate?: Date; endDate?: Date; accountId?: string }) {
        let sql = `
            SELECT j.*, a.code as accountCode, a.name as accountName, a.accountType,
                   t.transactionNumber, t.transactionType, t.status as transactionStatus
            FROM journal_entries j
            JOIN accounts a ON j.accountId = a.id
            JOIN transactions t ON j.transactionId = t.id
            WHERE a.tenantId = ?
        `;
        const queryParams: any[] = [tenantId];

        if (params.accountId) {
            sql += ` AND j.accountId = ?`;
            queryParams.push(params.accountId);
        }

        if (params.startDate && params.endDate) {
            sql += ` AND j.createdAt BETWEEN ? AND ?`;
            queryParams.push(params.startDate, params.endDate);
        }

        sql += ` ORDER BY j.createdAt DESC`;

        const results = await query(sql, queryParams);

        return results.map((r: any) => ({
            id: r.id,
            transactionId: r.transactionId,
            accountId: r.accountId,
            entryType: r.entryType,
            amount: Number(r.amount),
            description: r.description,
            createdAt: r.createdAt,
            account: {
                id: r.accountId,
                code: r.accountCode,
                name: r.accountName,
                accountType: r.accountType,
                tenantId
            },
            transaction: {
                id: r.transactionId,
                transactionNumber: r.transactionNumber,
                transactionType: r.transactionType,
                status: r.transactionStatus
            }
        }));
    }

    /**
     * Get Trial Balance
     */
    async getTrialBalance(tenantId: string) {
        const accounts = await query<RowDataPacket & any>(
            'SELECT * FROM accounts WHERE tenantId = ? AND status = ?',
            [tenantId, 'active']
        );

        return accounts.map(acc => {
            const balance = Number(acc.balance);
            return {
                id: acc.id,
                code: acc.code,
                name: acc.name,
                type: acc.accountType,
                debit: ['asset', 'expense'].includes(acc.accountType!) ? (balance > 0 ? balance : 0) : (balance < 0 ? Math.abs(balance) : 0),
                credit: ['liability', 'equity', 'revenue'].includes(acc.accountType!) ? (balance > 0 ? balance : 0) : (balance < 0 ? Math.abs(balance) : 0)
            };
        });
    }

    /**
     * Create Manual Journal Entry
     */
    async createManualJournalEntry(request: ManualEntryRequest) {
        return await withTransaction(async (conn) => {
            const { tenantId, description, items, date } = request;

            // Verify balance
            const totalDebit = items.filter(i => i.type === 'debit').reduce((sum, i) => sum + Number(i.amount), 0);
            const totalCredit = items.filter(i => i.type === 'credit').reduce((sum, i) => sum + Number(i.amount), 0);

            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                throw new Error('Journal entry must be balanced (Debits must equal Credits)');
            }

            // Create transaction record
            const transactionId = uuidv4();
            await conn.query(
                `INSERT INTO transactions (id, tenantId, transactionType, transactionNumber, transactionDate, amount, description, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [transactionId, tenantId, 'adjustment', `MANUAL-${Date.now()}`, date || new Date(), totalDebit, description, 'completed']
            );

            const savedEntries: any[] = [];
            for (const item of items) {
                const entryId = uuidv4();
                await conn.query(
                    'INSERT INTO journal_entries (id, transactionId, accountId, entryType, amount, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [entryId, transactionId, item.accountId, item.type, item.amount, item.description || description]
                );

                const [[savedEntry]] = await conn.query('SELECT * FROM journal_entries WHERE id = ?', [entryId]) as any;
                savedEntries.push(savedEntry);

                // Update balances
                await this.updateAccountBalanceConn(conn, item.accountId, item.type, Number(item.amount));
            }

            return savedEntries;
        });
    }

    /**
     * Process Vendor Payment
     */
    async processVendorPayment(tenantId: string, vendorId: string, amount: number, description: string) {
        return await withTransaction(async (conn) => {
            const [[vendor]] = await conn.query('SELECT * FROM vendors WHERE id = ? LIMIT 1', [vendorId]) as any;
            if (!vendor) throw new Error('Vendor not found');

            const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', 'asset');
            const apAcc = await this.getOrCreateAccount(tenantId, '2200', 'Accounts Payable', 'liability');

            const transactionId = uuidv4();
            await conn.query(
                `INSERT INTO transactions (id, tenantId, transactionType, transactionNumber, transactionDate, amount, description, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, NOW(), NOW())`,
                [transactionId, tenantId, 'withdrawal', `PAY-${Date.now()}`, amount, `Payment to ${vendor.name}: ${description}`, 'completed']
            );

            const entriesData = [
                { accountId: apAcc.id, entryType: 'debit', amount, description },
                { accountId: cashAcc.id, entryType: 'credit', amount, description }
            ];

            const savedEntries: any[] = [];
            for (const item of entriesData) {
                const entryId = uuidv4();
                await conn.query(
                    'INSERT INTO journal_entries (id, transactionId, accountId, entryType, amount, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [entryId, transactionId, item.accountId, item.entryType, item.amount, item.description]
                );
                const [[savedEntry]] = await conn.query('SELECT * FROM journal_entries WHERE id = ?', [entryId]) as any;
                savedEntries.push(savedEntry);

                await this.updateAccountBalanceConn(conn, item.accountId!, item.entryType, Number(item.amount));
            }

            return savedEntries;
        });
    }

    /**
     * Process Insurance Payout
     */
    async processInsurancePayout(tenantId: string, policyId: string, amount: number, description: string) {
        return await withTransaction(async (conn) => {
            const [[policy]] = await conn.query(`
                SELECT p.*, m.firstName, m.lastName 
                FROM insurance_policies p 
                LEFT JOIN members m ON p.memberId = m.id 
                WHERE p.id = ? LIMIT 1
            `, [policyId]) as any;

            if (!policy) throw new Error('Policy not found');

            const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', 'asset');
            const insPayableAcc = await this.getOrCreateAccount(tenantId, '2100', 'Insurance Premiums Payable', 'liability');

            const transactionId = uuidv4();
            await conn.query(
                `INSERT INTO transactions (id, tenantId, transactionType, transactionNumber, transactionDate, amount, description, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, NOW(), NOW())`,
                [transactionId, tenantId, 'withdrawal', `INS-${Date.now()}`, amount, `Insurance payout for ${policy.firstName} ${policy.lastName}: ${description}`, 'completed']
            );

            const entriesData = [
                { accountId: insPayableAcc.id, entryType: 'debit', amount, description },
                { accountId: cashAcc.id, entryType: 'credit', amount, description }
            ];

            const savedEntries: any[] = [];
            for (const item of entriesData) {
                const entryId = uuidv4();
                await conn.query(
                    'INSERT INTO journal_entries (id, transactionId, accountId, entryType, amount, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
                    [entryId, transactionId, item.accountId, item.entryType, item.amount, item.description]
                );
                const [[savedEntry]] = await conn.query('SELECT * FROM journal_entries WHERE id = ?', [entryId]) as any;
                savedEntries.push(savedEntry);

                await this.updateAccountBalanceConn(conn, item.accountId!, item.entryType, Number(item.amount));
            }

            return savedEntries;
        });
    }

    /**
     * Get Financial Statement Data
     */
    async getFinancialStatement(tenantId: string, type: 'balance-sheet' | 'income-statement') {
        const accounts = await query<RowDataPacket & any>('SELECT * FROM accounts WHERE tenantId = ?', [tenantId]);

        if (type === 'balance-sheet') {
            const assets = accounts.filter(a => a.accountType === 'asset');
            const liabilities = accounts.filter(a => a.accountType === 'liability');
            const equity = accounts.filter(a => a.accountType === 'equity');

            return {
                assets: assets.map(a => ({ name: a.name, balance: a.balance })),
                liabilities: liabilities.map(a => ({ name: a.name, balance: a.balance })),
                equity: equity.map(a => ({ name: a.name, balance: a.balance })),
                totalAssets: assets.reduce((sum, a) => sum + Number(a.balance), 0),
                totalLiabilities: liabilities.reduce((sum, a) => sum + Number(a.balance), 0),
                totalEquity: equity.reduce((sum, a) => sum + Number(a.balance), 0)
            };
        } else {
            const revenue = accounts.filter(a => a.accountType === 'revenue');
            const expenses = accounts.filter(a => a.accountType === 'expense');

            return {
                revenue: revenue.map(a => ({ name: a.name, balance: a.balance })),
                expenses: expenses.map(a => ({ name: a.name, balance: a.balance })),
                totalRevenue: revenue.reduce((sum, a) => sum + Number(a.balance), 0),
                totalExpenses: expenses.reduce((sum, a) => sum + Number(a.balance), 0),
                netIncome: revenue.reduce((sum, a) => sum + Number(a.balance), 0) - expenses.reduce((sum, a) => sum + Number(a.balance), 0)
            };
        }
    }
}
