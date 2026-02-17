import { Account, AccountType } from '@/src/entities/Account';
import { Transaction, TransactionType, TransactionStatus } from '@/src/entities/Transaction';
import { JournalEntry, EntryType } from '@/src/entities/JournalEntry';
import { getDb } from '@/lib/db';

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
    ): Promise<Transaction> {
        const db = await getDb();
        const transactionRepo = db.getRepository(Transaction);
        const journalEntryRepo = db.getRepository(JournalEntry);
        const accountRepo = db.getRepository(Account);

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
        const count = await transactionRepo.count({ where: { tenantId: this.tenantId } });
        const transactionNumber = `TXN-${this.tenantId.substring(0, 8)}-${String(count + 1).padStart(6, '0')}`;

        // Create transaction
        const transaction = transactionRepo.create({
            transactionNumber,
            transactionType,
            amount,
            transactionDate: new Date(),
            description,
            memberId,
            tenantId: this.tenantId,
            referenceId,
            referenceType,
            status: TransactionStatus.COMPLETED,
        });

        await transactionRepo.save(transaction);

        // Create journal entries and update account balances
        for (const entry of entries) {
            const journalEntry = journalEntryRepo.create({
                transactionId: transaction.id,
                accountId: entry.accountId,
                entryType: entry.entryType,
                amount: entry.amount,
                description: entry.description || description,
            });

            await journalEntryRepo.save(journalEntry);

            // Update account balance
            const account = await accountRepo.findOne({ where: { id: entry.accountId } });
            if (account) {
                if (entry.entryType === EntryType.DEBIT) {
                    if ([AccountType.ASSET, AccountType.EXPENSE].includes(account.accountType)) {
                        account.balance += entry.amount;
                    } else {
                        account.balance -= entry.amount;
                    }
                } else {
                    if ([AccountType.LIABILITY, AccountType.EQUITY, AccountType.REVENUE].includes(account.accountType)) {
                        account.balance += entry.amount;
                    } else {
                        account.balance -= entry.amount;
                    }
                }
                await accountRepo.save(account);
            }
        }

        return transaction;
    }

    async getTrialBalance(asOfDate?: Date): Promise<{ accountName: string; debit: number; credit: number }[]> {
        const db = await getDb();
        const accountRepo = db.getRepository(Account);

        const accounts = await accountRepo.find({
            where: { tenantId: this.tenantId },
            order: { code: 'ASC' },
        });

        return accounts.map((account) => ({
            accountName: `${account.code} - ${account.name}`,
            debit: account.balance >= 0 ? account.balance : 0,
            credit: account.balance < 0 ? Math.abs(account.balance) : 0,
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
        const db = await getDb();
        const accountRepo = db.getRepository(Account);

        const accounts = await accountRepo.find({
            where: { tenantId: this.tenantId },
        });

        const assets = accounts
            .filter((a) => a.accountType === AccountType.ASSET)
            .map((a) => ({ name: a.name, amount: a.balance }));

        const liabilities = accounts
            .filter((a) => a.accountType === AccountType.LIABILITY)
            .map((a) => ({ name: a.name, amount: a.balance }));

        const equity = accounts
            .filter((a) => a.accountType === AccountType.EQUITY)
            .map((a) => ({ name: a.name, amount: a.balance }));

        return {
            assets,
            liabilities,
            equity,
            totalAssets: assets.reduce((sum, a) => sum + a.amount, 0),
            totalLiabilities: liabilities.reduce((sum, l) => sum + l.amount, 0),
            totalEquity: equity.reduce((sum, e) => sum + e.amount, 0),
        };
    }

    async getProfitAndLoss(startDate: Date, endDate: Date): Promise<{
        revenue: { name: string; amount: number }[];
        expenses: { name: string; amount: number }[];
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
    }> {
        const db = await getDb();
        const accountRepo = db.getRepository(Account);

        const accounts = await accountRepo.find({
            where: { tenantId: this.tenantId },
        });

        const revenue = accounts
            .filter((a) => a.accountType === AccountType.REVENUE)
            .map((a) => ({ name: a.name, amount: a.balance }));

        const expenses = accounts
            .filter((a) => a.accountType === AccountType.EXPENSE)
            .map((a) => ({ name: a.name, amount: a.balance }));

        const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        return {
            revenue,
            expenses,
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
        };
    }
}
