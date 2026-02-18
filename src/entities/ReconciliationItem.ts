import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import type { ReconciliationBatch } from './ReconciliationBatch';
import type { Member } from './Member';

export enum MatchStatus {
    MATCHED = 'matched',
    VARIANCE = 'variance',
    MISSING_IN_MOF = 'missing_in_mof',
    ORPHAN_IN_MOF = 'orphan_in_mof',
}

export enum VarianceReason {
    INSUFFICIENT_FUNDS = 'insufficient_funds',
    MEMBER_TERMINATED = 'member_terminated',
    NET_PAY_TOO_LOW = 'net_pay_too_low',
    AMOUNT_MISMATCH = 'amount_mismatch',
    OTHER = 'other',
}

@Entity('reconciliation_items')
export class ReconciliationItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    batchId!: string;

    @ManyToOne(() => require('./ReconciliationBatch').ReconciliationBatch, (batch: ReconciliationBatch) => batch.items)
    @JoinColumn({ name: 'batchId' })
    batch!: ReconciliationBatch;

    @Column({ type: 'uuid', nullable: true })
    memberId?: string;

    @ManyToOne(() => require('./Member').Member, { nullable: true })
    @JoinColumn({ name: 'memberId' })
    member?: Member;

    @Column({ nullable: true })
    memberNumber?: string;

    @Column({ nullable: true })
    nationalId?: string;

    @Column({ nullable: true })
    employeeNumber?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    expectedAmount!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    requestedAmount!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    actualAmount!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    variance!: number;

    @Column({ type: 'enum', enum: MatchStatus })
    matchStatus!: MatchStatus;

    @Column({ type: 'enum', enum: VarianceReason, nullable: true })
    varianceReason?: VarianceReason;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ default: false })
    requiresManualReview!: boolean;

    @Column({ default: false })
    journalPosted!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}
