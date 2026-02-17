import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
} from 'typeorm';
import { JournalEntry } from './JournalEntry';
import { Member } from './Member';

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

@Entity('transactions')
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    transactionNumber!: string;

    @Column({ type: 'enum', enum: TransactionType })
    transactionType!: TransactionType;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount!: number;

    @Column({ type: 'date' })
    transactionDate!: Date;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid', nullable: true })
    memberId?: string;

    @Column({ type: 'uuid', nullable: true })
    tenantId?: string;

    @Column({ type: 'uuid', nullable: true })
    referenceId?: string;

    @Column({ nullable: true })
    referenceType?: string;

    @ManyToOne(() => Member)
    @JoinColumn({ name: 'memberId' })
    member?: Member;

    @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING })
    status!: TransactionStatus;

    @Column({ type: 'uuid', nullable: true })
    createdBy?: string;

    @Column({ type: 'uuid', nullable: true })
    approvedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt?: Date;

    @OneToMany(() => JournalEntry, (entry) => entry.transaction, { cascade: true })
    journalEntries!: JournalEntry[];

    @CreateDateColumn()
    createdAt!: Date;
}
