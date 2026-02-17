import { AppDataSource } from '../config/database';
import { Account, AccountType, AccountStatus } from '../entities/Account';
import { JournalEntry, EntryType } from '../entities/JournalEntry';
import { Transaction, TransactionType } from '../entities/Transaction';
import { Repository } from 'typeorm';

export class AccountingService {
    private accountRepo: Repository<Account>;
    private journalRepo: Repository<JournalEntry>;

    constructor() {
        this.accountRepo = AppDataSource.getRepository(Account);
        this.journalRepo = AppDataSource.getRepository(JournalEntry);
    }

    /**
     * Get or create a default account for a tenant
     */
    async getOrCreateAccount(tenantId: string, code: string, name: string, type: AccountType): Promise<Account> {
        let account = await this.accountRepo.findOne({ where: { tenantId, code } });
        if (!account) {
            account = this.accountRepo.create({
                tenantId,
                code,
                name,
                accountType: type,
                balance: 0,
                status: AccountStatus.ACTIVE,
            });
            await this.accountRepo.save(account);
        }
        return account;
    }

    /**
     * Initialize standard chart of accounts for a tenant
     */
    async initializeChartOfAccounts(tenantId: string) {
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
            await this.getOrCreateAccount(tenantId, def.code, def.name, def.type);
        }
    }

    /**
     * Process a transaction and create corresponding journal entries
     */
    async processTransaction(transactionId: string): Promise<JournalEntry[]> {
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const transaction = await transactionRepo.findOne({ where: { id: transactionId } });

        if (!transaction) throw new Error('Transaction not found');
        if (!transaction.tenantId) throw new Error('Transaction must have a tenantId');

        const { tenantId, transactionType, amount, description } = transaction;
        const entries: Partial<JournalEntry>[] = [];

        switch (transactionType) {
            case TransactionType.DEPOSIT: {
                const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
                const savingsAcc = await this.getOrCreateAccount(tenantId, '2000', 'Member Savings', AccountType.LIABILITY);
                entries.push(
                    { transactionId, accountId: cashAcc.id, entryType: EntryType.DEBIT, amount, description },
                    { transactionId, accountId: savingsAcc.id, entryType: EntryType.CREDIT, amount, description }
                );
                break;
            }
            case TransactionType.WITHDRAWAL: {
                const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
                const savingsAcc = await this.getOrCreateAccount(tenantId, '2000', 'Member Savings', AccountType.LIABILITY);
                entries.push(
                    { transactionId, accountId: savingsAcc.id, entryType: EntryType.DEBIT, amount, description },
                    { transactionId, accountId: cashAcc.id, entryType: EntryType.CREDIT, amount, description }
                );
                break;
            }
            case TransactionType.LOAN_DISBURSEMENT: {
                const loanAcc = await this.getOrCreateAccount(tenantId, '1100', 'Loan Portfolio', AccountType.ASSET);
                const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
                entries.push(
                    { transactionId, accountId: loanAcc.id, entryType: EntryType.DEBIT, amount, description },
                    { transactionId, accountId: cashAcc.id, entryType: EntryType.CREDIT, amount, description }
                );
                break;
            }
            case TransactionType.LOAN_REPAYMENT: {
                const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
                const loanAcc = await this.getOrCreateAccount(tenantId, '1100', 'Loan Portfolio', AccountType.ASSET);
                entries.push(
                    { transactionId, accountId: cashAcc.id, entryType: EntryType.DEBIT, amount, description },
                    { transactionId, accountId: loanAcc.id, entryType: EntryType.CREDIT, amount, description }
                );
                break;
            }
            case TransactionType.INSURANCE_PREMIUM: {
                const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
                const insAcc = await this.getOrCreateAccount(tenantId, '2100', 'Insurance Premiums Payable', AccountType.LIABILITY);
                entries.push(
                    { transactionId, accountId: cashAcc.id, entryType: EntryType.DEBIT, amount, description },
                    { transactionId, accountId: insAcc.id, entryType: EntryType.CREDIT, amount, description }
                );
                break;
            }
            case TransactionType.MERCHANDISE_PURCHASE: {
                const invAcc = await this.getOrCreateAccount(tenantId, '1200', 'Inventory', AccountType.ASSET);
                const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
                entries.push(
                    { transactionId, accountId: invAcc.id, entryType: EntryType.DEBIT, amount, description },
                    { transactionId, accountId: cashAcc.id, entryType: EntryType.CREDIT, amount, description }
                );
                break;
            }
        }

        if (entries.length === 0) return [];

        const journalEntries = this.journalRepo.create(entries as JournalEntry[]);
        const savedEntries = await this.journalRepo.save(journalEntries);

        // Update account balances
        for (const entry of savedEntries) {
            const account = await this.accountRepo.findOne({ where: { id: entry.accountId } });
            if (account) {
                const amt = Number(entry.amount);
                // Normal Balance Logic:
                // Asset/Expense: Debit+, Credit-
                // Liability/Equity/Revenue: Credit+, Debit-
                const isDebit = entry.entryType === EntryType.DEBIT;
                const increasesOnDebit = [AccountType.ASSET, AccountType.EXPENSE].includes(account.accountType);

                if (isDebit === increasesOnDebit) {
                    account.balance = Number(account.balance) + amt;
                } else {
                    account.balance = Number(account.balance) - amt;
                }
                await this.accountRepo.save(account);
            }
        }

        return savedEntries;
    }
}
