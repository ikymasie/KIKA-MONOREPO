import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { TenantStatus } from './Tenant';

@Entity('tenant_status_logs')
@Index(['tenantId'])
@Index(['changedAt'])
export class TenantStatusLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne('Tenant', { nullable: false })
    @JoinColumn({ name: 'tenantId' })
    tenant!: any;

    @Column({ type: 'enum', enum: TenantStatus })
    previousStatus!: TenantStatus;

    @Column({ type: 'enum', enum: TenantStatus })
    newStatus!: TenantStatus;

    @Column({ type: 'text' })
    reason!: string;

    @Column({ type: 'uuid' })
    changedBy!: string;

    @ManyToOne('User', { nullable: false })
    @JoinColumn({ name: 'changedBy' })
    changer!: any;

    @Column({ type: 'timestamp' })
    changedAt!: Date;

    @Column({ type: 'date' })
    effectiveDate!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
