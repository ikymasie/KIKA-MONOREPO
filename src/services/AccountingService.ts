import { AppDataSource } from '../config/database';
import { Account, AccountType, AccountStatus } from '../entities/Account';
import { JournalEntry, EntryType } from '../entities/JournalEntry';
import { Transaction, TransactionType, TransactionStatus } from '../entities/Transaction';
import { Repository, Between, In } from 'typeorm';
import { Vendor } from '../entities/Vendor';
import { InsurancePolicy } from '../entities/InsurancePolicy';

export interface ManualEntryRequest {
    tenantId: string;
    description: string;
    date: Date;
    items: {
        accountId: string;
        type: EntryType;
        amount: number;
        description?: string;
    }[];
}

export class AccountingService {
    private get accountRepo(): Repository<Account> {
        return AppDataSource.getRepository(Account);
    }

    private get journalRepo(): Repository<JournalEntry> {
        return AppDataSource.getRepository(JournalEntry);
    }

    private get transactionRepo(): Repository<Transaction> {
        return AppDataSource.getRepository(Transaction);
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
        const transaction = await this.transactionRepo.findOne({ where: { id: transactionId } });

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
            await this.updateAccountBalance(entry.accountId, entry.entryType, entry.amount);
        }

        return savedEntries;
    }

    private async updateAccountBalance(accountId: string, entryType: EntryType, amount: number) {
        const account = await this.accountRepo.findOne({ where: { id: accountId } });
        if (account) {
            const amt = Number(amount);
            const isDebit = entryType === EntryType.DEBIT;
            const increasesOnDebit = [AccountType.ASSET, AccountType.EXPENSE].includes(account.accountType);

            if (isDebit === increasesOnDebit) {
                account.balance = Number(account.balance) + amt;
            } else {
                account.balance = Number(account.balance) - amt;
            }
            await this.accountRepo.save(account);
        }
    }

    /**
     * Get General Ledger entries
     */
    async getGeneralLedger(tenantId: string, params: { startDate?: Date; endDate?: Date; accountId?: string }) {
        const query: any = {
            where: {
                account: { tenantId }
            },
            relations: ['account', 'transaction'],
            order: { createdAt: 'DESC' }
        };

        if (params.accountId) {
            query.where.accountId = params.accountId;
        }

        if (params.startDate && params.endDate) {
            query.where.createdAt = Between(params.startDate, params.endDate);
        }

        return await this.journalRepo.find(query);
    }

    /**
     * Get Trial Balance
     */
    async getTrialBalance(tenantId: string) {
        const accounts = await this.accountRepo.find({
            where: { tenantId, status: AccountStatus.ACTIVE }
        });

        return accounts.map(acc => ({
            id: acc.id,
            code: acc.code,
            name: acc.name,
            type: acc.accountType,
            debit: [AccountType.ASSET, AccountType.EXPENSE].includes(acc.accountType) ? (acc.balance > 0 ? acc.balance : 0) : (acc.balance < 0 ? Math.abs(acc.balance) : 0),
            credit: [AccountType.LIABILITY, AccountType.EQUITY, AccountType.REVENUE].includes(acc.accountType) ? (acc.balance > 0 ? acc.balance : 0) : (acc.balance < 0 ? Math.abs(acc.balance) : 0)
        }));
    }

    /**
     * Create Manual Journal Entry
     */
    async createManualJournalEntry(request: ManualEntryRequest) {
        const { tenantId, description, items, date } = request;

        // Verify balance
        const totalDebit = items.filter(i => i.type === EntryType.DEBIT).reduce((sum, i) => sum + Number(i.amount), 0);
        const totalCredit = items.filter(i => i.type === EntryType.CREDIT).reduce((sum, i) => sum + Number(i.amount), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error('Journal entry must be balanced (Debits must equal Credits)');
        }

        // Create transaction record
        const transaction = this.transactionRepo.create({
            tenantId,
            transactionType: TransactionType.ADJUSTMENT,
            transactionNumber: `MANUAL-${Date.now()}`,
            transactionDate: date || new Date(),
            amount: totalDebit,
            description,
            status: TransactionStatus.COMPLETED
        });
        await this.transactionRepo.save(transaction);

        const journalEntries = items.map(item => this.journalRepo.create({
            transactionId: transaction.id,
            accountId: item.accountId,
            entryType: item.type,
            amount: item.amount,
            description: item.description || description
        }));

        const savedEntries = await this.journalRepo.save(journalEntries);

        // Update balances
        for (const entry of savedEntries) {
            await this.updateAccountBalance(entry.accountId, entry.entryType, entry.amount);
        }

        return savedEntries;
    }

    /**
     * Process Vendor Payment
     */
    async processVendorPayment(tenantId: string, vendorId: string, amount: number, description: string) {
        const vendorRepo = AppDataSource.getRepository(Vendor);
        const vendor = await vendorRepo.findOne({ where: { id: vendorId } });
        if (!vendor) throw new Error('Vendor not found');

        const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
        const apAcc = await this.getOrCreateAccount(tenantId, '2200', 'Accounts Payable', AccountType.LIABILITY);

        const transaction = this.transactionRepo.create({
            tenantId,
            transactionType: TransactionType.WITHDRAWAL,
            transactionNumber: `PAY-${Date.now()}`,
            transactionDate: new Date(),
            amount,
            description: `Payment to ${vendor.name}: ${description}`,
            status: TransactionStatus.COMPLETED
        });
        await this.transactionRepo.save(transaction);

        const entries = [
            this.journalRepo.create({ transactionId: transaction.id, accountId: apAcc.id, entryType: EntryType.DEBIT, amount, description }),
            this.journalRepo.create({ transactionId: transaction.id, accountId: cashAcc.id, entryType: EntryType.CREDIT, amount, description })
        ];

        const savedEntries = await this.journalRepo.save(entries);
        for (const entry of savedEntries) {
            await this.updateAccountBalance(entry.accountId, entry.entryType, entry.amount);
        }

        return savedEntries;
    }

    /**
     * Process Insurance Payout
     */
    async processInsurancePayout(tenantId: string, policyId: string, amount: number, description: string) {
        const policyRepo = AppDataSource.getRepository(InsurancePolicy);
        const policy = await policyRepo.findOne({ where: { id: policyId }, relations: ['member'] });
        if (!policy) throw new Error('Policy not found');

        const cashAcc = await this.getOrCreateAccount(tenantId, '1000', 'Cash at Bank', AccountType.ASSET);
        const insPayableAcc = await this.getOrCreateAccount(tenantId, '2100', 'Insurance Premiums Payable', AccountType.LIABILITY);

        const transaction = this.transactionRepo.create({
            tenantId,
            transactionType: TransactionType.WITHDRAWAL,
            transactionNumber: `INS-${Date.now()}`,
            transactionDate: new Date(),
            amount,
            description: `Insurance payout for ${policy.member.firstName} ${policy.member.lastName}: ${description}`,
            status: TransactionStatus.COMPLETED
        });
        await this.transactionRepo.save(transaction);

        const entries = [
            this.journalRepo.create({ transactionId: transaction.id, accountId: insPayableAcc.id, entryType: EntryType.DEBIT, amount, description }),
            this.journalRepo.create({ transactionId: transaction.id, accountId: cashAcc.id, entryType: EntryType.CREDIT, amount, description })
        ];

        const savedEntries = await this.journalRepo.save(entries);
        for (const entry of savedEntries) {
            await this.updateAccountBalance(entry.accountId, entry.entryType, entry.amount);
        }

        return savedEntries;
    }

    /**
     * Get Financial Statement Data
     */
    async getFinancialStatement(tenantId: string, type: 'balance-sheet' | 'income-statement') {
        const accounts = await this.accountRepo.find({ where: { tenantId } });

        if (type === 'balance-sheet') {
            const assets = accounts.filter(a => a.accountType === AccountType.ASSET);
            const liabilities = accounts.filter(a => a.accountType === AccountType.LIABILITY);
            const equity = accounts.filter(a => a.accountType === AccountType.EQUITY);

            return {
                assets: assets.map(a => ({ name: a.name, balance: a.balance })),
                liabilities: liabilities.map(a => ({ name: a.name, balance: a.balance })),
                equity: equity.map(a => ({ name: a.name, balance: a.balance })),
                totalAssets: assets.reduce((sum, a) => sum + Number(a.balance), 0),
                totalLiabilities: liabilities.reduce((sum, a) => sum + Number(a.balance), 0),
                totalEquity: equity.reduce((sum, a) => sum + Number(a.balance), 0)
            };
        } else {
            const revenue = accounts.filter(a => a.accountType === AccountType.REVENUE);
            const expenses = accounts.filter(a => a.accountType === AccountType.EXPENSE);

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
