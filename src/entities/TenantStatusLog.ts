import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import type { Tenant } from './Tenant';
import { TenantStatus } from './Tenant';
import type { User } from './User';

@Entity('tenant_status_logs')
@Index(['tenantId'])
@Index(['changedAt'])
export class TenantStatusLog {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @Column({ type: 'uuid' })
    tenantId?: string;

    @ManyToOne('Tenant')
    @JoinColumn({ name: 'tenantId' })
    tenant?: Tenant;

    @Column({ type: 'enum', enum: TenantStatus })
    previousStatus?: TenantStatus;

    @Column({ type: 'enum', enum: TenantStatus })
    newStatus?: TenantStatus;

    @Column({ type: 'text' })
    reason?: string;

    @Column({ type: 'uuid' })
    changedBy?: string;

    @ManyToOne('User')
    @JoinColumn({ name: 'changedBy' })
    changer?: User;

    @Column({ type: 'timestamp' })
    changedAt?: Date;

    @Column({ type: 'date' })
    effectiveDate?: Date;

    @CreateDateColumn()
    createdAt?: Date;
}
