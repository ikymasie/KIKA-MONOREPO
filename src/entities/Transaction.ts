import type { JournalEntry } from './JournalEntry';
import type { Member } from './Member';

export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    LOAN_DISBURSEMENT = 'loan_disbursement',
    LOAN_REPAYMENT = 'loan_repayment',
    INSURANCE_PREMIUM = 'insurance_premium',
    INSURANCE_CLAIM = 'insurance_claim',
    MERCHANDISE_PURCHASE = 'merchandise_purchase',
    MERCHANDISE_PAYMENT = 'merchandise_payment',
    DEDUCTION = 'deduction',
    FEE = 'fee',
    INTEREST = 'interest',
    DIVIDEND = 'dividend',
    TRANSFER = 'transfer',
    ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    REVERSED = 'reversed',
    FAILED = 'failed',
}
export class Transaction {
    id?: string;
    transactionNumber?: string;
    transactionType?: TransactionType;
    amount?: number;
    transactionDate?: Date;
    description?: string;
    memberId?: string;
    tenantId?: string;
    referenceId?: string;
    referenceType?: string;
    member?: Member;
    status?: TransactionStatus;
    createdBy?: string;
    approvedBy?: string;
    approvedAt?: Date;
    journalEntries?: JournalEntry[];
    createdAt?: Date;
}
