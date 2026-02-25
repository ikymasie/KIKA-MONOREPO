import type { Tenant } from './Tenant';
import type { JournalEntry } from './JournalEntry';

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
export class Account {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    code?: string;
    name?: string;
    accountType?: AccountType;
    description?: string;
    parentAccountId?: string;
    parentAccount?: Account;
    balance?: number;
    status?: AccountStatus;
    journalEntries?: JournalEntry[];
    createdAt?: Date;
    updatedAt?: Date;
}
