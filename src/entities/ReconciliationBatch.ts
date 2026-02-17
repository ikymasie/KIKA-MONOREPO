import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';
import { ReconciliationItem } from './ReconciliationItem';

export enum ReconciliationStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('reconciliation_batches')
export class ReconciliationBatch {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    batchNumber!: string;

    @Column({ type: 'int' })
    month!: number;

    @Column({ type: 'int' })
    year!: number;

    @Column({ nullable: true })
    mofFileUrl?: string;

    @Column({ type: 'uuid', nullable: true })
    deductionRequestId?: string;

    @ManyToOne(() => require('./DeductionRequest').DeductionRequest, { nullable: true })
    @JoinColumn({ name: 'deductionRequestId' })
    deductionRequest?: any;

    @Column({ type: 'int', default: 0 })
    totalRecords!: number;

    @Column({ type: 'int', default: 0 })
    matchedRecords!: number;

    @Column({ type: 'int', default: 0 })
    unmatchedRecords!: number;

    @Column({ type: 'int', default: 0 })
    varianceRecords!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalExpected!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalActual!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalVariance!: number;

    @Column({ type: 'enum', enum: ReconciliationStatus, default: ReconciliationStatus.PENDING })
    status!: ReconciliationStatus;

    @Column({ type: 'uuid', nullable: true })
    processedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    processedAt?: Date;

    @Column({ default: false })
    journalsPosted!: boolean;

    @OneToMany(() => ReconciliationItem, (item) => item.batch, { cascade: true })
    items!: ReconciliationItem[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
