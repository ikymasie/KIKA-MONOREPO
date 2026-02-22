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
import type { Tenant } from './Tenant';
import type { DeductionItem } from './DeductionItem';

export enum DeductionRequestStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}

@Entity('deduction_requests')
export class DeductionRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant, (tenant: Tenant) => tenant.deductionRequests)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    batchNumber!: string;

    @Column({ type: 'int' })
    month!: number;

    @Column({ type: 'int' })
    year!: number;

    @Column({ type: 'int', default: 0 })
    totalMembers!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ type: 'enum', enum: DeductionRequestStatus, default: DeductionRequestStatus.DRAFT })
    status!: DeductionRequestStatus;

    @Column({ nullable: true })
    csvFileUrl?: string;

    @Column({ type: 'uuid', nullable: true })
    submittedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    submittedAt?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @OneToMany(() => require('./DeductionItem').DeductionItem, (item: DeductionItem) => item.request, { cascade: true })
    items!: DeductionItem[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
