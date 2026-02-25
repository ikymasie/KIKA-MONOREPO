import { AccountType } from '@/src/entities/Account';
import { TransactionType, TransactionStatus } from '@/src/entities/Transaction';
import { EntryType } from '@/src/entities/JournalEntry';
import { query, queryOne, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';

export interface JournalEntryInput {
    accountId: string;
    entryType: EntryType;
    amount: number;
    description?: string;
}

export class GeneralLedger {
    private tenantId: string;

    constructor(tenantId: string) {
        this.tenantId = tenantId;
    }

    async postTransaction(
        transactionType: TransactionType,
        amount: number,
        description: string,
        entries: JournalEntryInput[],
        memberId?: string,
        referenceId?: string,
        referenceType?: string
    ) {
        // Validate double-entry (debits must equal credits)
        const totalDebits = entries
            .filter((e) => e.entryType === EntryType.DEBIT)
            .reduce((sum, e) => sum + e.amount, 0);
        const totalCredits = entries
            .filter((e) => e.entryType === EntryType.CREDIT)
            .reduce((sum, e) => sum + e.amount, 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            throw new Error('Debits must equal credits in double-entry accounting');
        }

        // Generate transaction number
        const countRow = await queryOne<any>(
            'SELECT COUNT(*) as c FROM transactions WHERE tenantId = ?',
            [this.tenantId]
        );
        const transactionNumber = `TXN-${this.tenantId.substring(0, 8)}-${String(Number(countRow?.c || 0) + 1).padStart(6, '0')}`;
        const transactionId = uuidv4();

        // Create transaction
        await execute(
            `INSERT INTO transactions (id, transactionNumber, transactionType, amount, transactionDate, description, memberId, tenantId, referenceId, referenceType, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [transactionId, transactionNumber, transactionType, amount, description, memberId || null, this.tenantId, referenceId || null, referenceType || null, TransactionStatus.COMPLETED]
        );

        // Create journal entries and update account balances
        for (const entry of entries) {
            const journalId = uuidv4();
            await execute(
                `INSERT INTO journal_entries (id, transactionId, accountId, entryType, amount, description, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [journalId, transactionId, entry.accountId, entry.entryType, entry.amount, entry.description || description]
            );

            // Update account balance
            const account = await queryOne<any>('SELECT id, accountType, balance FROM accounts WHERE id = ?', [entry.accountId]);
            if (account) {
                let balanceDelta = 0;
                if (entry.entryType === EntryType.DEBIT) {
                    if ([AccountType.ASSET, AccountType.EXPENSE].includes(account.accountType)) {
                        balanceDelta = entry.amount;
                    } else {
                        balanceDelta = -entry.amount;
                    }
                } else {
                    if ([AccountType.LIABILITY, AccountType.EQUITY, AccountType.REVENUE].includes(account.accountType)) {
                        balanceDelta = entry.amount;
                    } else {
                        balanceDelta = -entry.amount;
                    }
                }
                await execute(
                    'UPDATE accounts SET balance = COALESCE(balance, 0) + ?, updatedAt = NOW() WHERE id = ?',
                    [balanceDelta, entry.accountId]
                );
            }
        }

        return await queryOne<any>('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    }

    async getTrialBalance(asOfDate?: Date): Promise<{ accountName: string; debit: number; credit: number }[]> {
        const accounts = await query<any>(
            'SELECT code, name, balance FROM accounts WHERE tenantId = ? ORDER BY code ASC',
            [this.tenantId]
        );

        return accounts.map((account: any) => ({
            accountName: `${account.code} - ${account.name}`,
            debit: (account.balance || 0) >= 0 ? (account.balance || 0) : 0,
            credit: (account.balance || 0) < 0 ? Math.abs(account.balance || 0) : 0,
        }));
    }

    async getBalanceSheet(asOfDate: Date = new Date()): Promise<{
        assets: { name: string; amount: number }[];
        liabilities: { name: string; amount: number }[];
        equity: { name: string; amount: number }[];
        totalAssets: number;
        totalLiabilities: number;
        totalEquity: number;
    }> {
        const accounts = await query<any>(
            'SELECT name, accountType, balance FROM accounts WHERE tenantId = ?',
            [this.tenantId]
        );

        const assets = accounts.filter((a: any) => a.accountType === AccountType.ASSET).map((a: any) => ({ name: a.name || 'Unknown', amount: a.balance || 0 }));
        const liabilities = accounts.filter((a: any) => a.accountType === AccountType.LIABILITY).map((a: any) => ({ name: a.name || 'Unknown', amount: a.balance || 0 }));
        const equity = accounts.filter((a: any) => a.accountType === AccountType.EQUITY).map((a: any) => ({ name: a.name || 'Unknown', amount: a.balance || 0 }));

        return {
            assets, liabilities, equity,
            totalAssets: assets.reduce((sum: number, a: any) => sum + a.amount, 0),
            totalLiabilities: liabilities.reduce((sum: number, l: any) => sum + l.amount, 0),
            totalEquity: equity.reduce((sum: number, e: any) => sum + e.amount, 0),
        };
    }

    async getProfitAndLoss(startDate: Date, endDate: Date): Promise<{
        revenue: { name: string; amount: number }[];
        expenses: { name: string; amount: number }[];
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
    }> {
        const accounts = await query<any>(
            'SELECT name, accountType, balance FROM accounts WHERE tenantId = ?',
            [this.tenantId]
        );

        const revenue = accounts.filter((a: any) => a.accountType === AccountType.REVENUE).map((a: any) => ({ name: a.name || 'Unknown', amount: a.balance || 0 }));
        const expenses = accounts.filter((a: any) => a.accountType === AccountType.EXPENSE).map((a: any) => ({ name: a.name || 'Unknown', amount: a.balance || 0 }));
        const totalRevenue = revenue.reduce((sum: number, r: any) => sum + r.amount, 0);
        const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);

        return { revenue, expenses, totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses };
    }
}
