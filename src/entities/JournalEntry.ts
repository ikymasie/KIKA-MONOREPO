import type { Account } from './Account';
import type { Transaction } from './Transaction';

export enum EntryType {
    DEBIT = 'debit',
    CREDIT = 'credit',
}
export class JournalEntry {
    id?: string;
    transactionId?: string;
    transaction?: Transaction;
    accountId?: string;
    account?: Account;
    entryType?: EntryType;
    amount?: number;
    description?: string;
    createdAt?: Date;
}
