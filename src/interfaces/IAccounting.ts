export enum AccountType {
    ASSET = 'asset',
    LIABILITY = 'liability',
    EQUITY = 'equity',
    REVENUE = 'revenue',
    EXPENSE = 'expense',
}

export enum AccountStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export interface IAccount {
    id: string;
    tenantId: string;
    code: string;
    name: string;
    accountType: AccountType;
    description?: string | null;
    parentAccountId?: string | null;
    balance: number;
    status: AccountStatus;
    createdAt: Date;
    updatedAt: Date;

    // Virtual fields joined
    parentAccountName?: string;
}

export enum EntryType {
    DEBIT = 'debit',
    CREDIT = 'credit',
}

export interface IJournalEntry {
    id: string;
    transactionId: string;
    accountId: string;
    entryType: EntryType;
    amount: number;
    description?: string | null;
    createdAt: Date;

    // Virtual fields
    accountCode?: string;
    accountName?: string;
}

export interface ILedgerTransaction {
    id: string;
    tenantId: string;
    transactionDate: Date;
    description: string;
    referenceNumber: string;
    status: string; // PENDING, POSTED, CANCELLED
    postedBy?: string | null;
    postedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
