import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Account } from './Account';
import { Transaction } from './Transaction';

export enum EntryType {
    DEBIT = 'debit',
    CREDIT = 'credit',
}

@Entity('journal_entries')
export class JournalEntry {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    transactionId!: string;

    @ManyToOne(() => Transaction, (transaction) => transaction.journalEntries)
    @JoinColumn({ name: 'transactionId' })
    transaction!: Transaction;

    @Column({ type: 'uuid' })
    accountId!: string;

    @ManyToOne(() => Account, (account) => account.journalEntries)
    @JoinColumn({ name: 'accountId' })
    account!: Account;

    @Column({ type: 'enum', enum: EntryType })
    entryType!: EntryType;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount!: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
