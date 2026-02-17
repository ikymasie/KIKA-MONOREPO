import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Tenant } from './Tenant';
import { Member } from './Member';

export enum SuspenseStatus {
    PENDING = 'pending',
    ALLOCATED = 'allocated',
    REFUNDED = 'refunded',
    WRITTEN_OFF = 'written_off',
}

@Entity('suspense_accounts')
export class SuspenseAccount {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    referenceNumber!: string;

    @Column({ type: 'uuid', nullable: true })
    reconciliationBatchId?: string;

    @Column({ nullable: true })
    memberNumber?: string;

    @Column({ nullable: true })
    nationalId?: string;

    @Column({ nullable: true })
    employeeNumber?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    amount!: number;

    @Column({ type: 'int' })
    month!: number;

    @Column({ type: 'int' })
    year!: number;

    @Column({ type: 'enum', enum: SuspenseStatus, default: SuspenseStatus.PENDING })
    status!: SuspenseStatus;

    @Column({ type: 'text', nullable: true })
    reason?: string;

    @Column({ type: 'uuid', nullable: true })
    allocatedToMemberId?: string;

    @ManyToOne(() => Member, { nullable: true })
    @JoinColumn({ name: 'allocatedToMemberId' })
    allocatedToMember?: Member;

    @Column({ type: 'uuid', nullable: true })
    allocatedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    allocatedAt?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'int', default: 0 })
    daysInSuspense!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
