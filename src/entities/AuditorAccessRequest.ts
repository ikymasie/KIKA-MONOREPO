import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Tenant } from './Tenant';

export enum AccessRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}

@Entity('auditor_access_requests')
export class AuditorAccessRequest {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    auditorId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'auditorId' })
    auditor!: User;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({
        type: 'enum',
        enum: AccessRequestStatus,
        default: AccessRequestStatus.PENDING,
    })
    status!: AccessRequestStatus;

    @Column({ type: 'timestamp' })
    startDate!: Date;

    @Column({ type: 'timestamp' })
    endDate!: Date;

    @Column({ type: 'text' })
    purpose!: string;

    @Column({ type: 'uuid', nullable: true })
    approvedById?: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'approvedById' })
    approvedBy?: User;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
