import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

export enum BylawStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('bylaws')
@Index(['tenantId'])
@Index(['status'])
export class Bylaw {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne('Tenant', { nullable: false })
    @JoinColumn({ name: 'tenantId' })
    tenant!: any;

    @Column()
    version!: string;

    @Column({ type: 'date' })
    submittedDate!: Date;

    @Column({ type: 'enum', enum: BylawStatus, default: BylawStatus.PENDING })
    status!: BylawStatus;

    @Column({ nullable: true })
    documentUrl?: string;

    @Column({ type: 'json', nullable: true })
    content?: Record<string, any>;

    @Column({ type: 'uuid', nullable: true })
    approvedBy?: string;

    @ManyToOne('User', { nullable: true })
    @JoinColumn({ name: 'approvedBy' })
    approver?: any;

    @Column({ type: 'timestamp', nullable: true })
    approvedDate?: Date;

    @Column({ type: 'date', nullable: true })
    effectiveDate?: Date;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
