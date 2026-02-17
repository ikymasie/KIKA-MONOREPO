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
import { User } from './User';

export enum AuditStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}

@Entity('compliance_audits')
export class ComplianceAudit {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'timestamp' })
    scheduledDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    completedDate?: Date;

    @Column({ type: 'enum', enum: AuditStatus, default: AuditStatus.PENDING })
    status!: AuditStatus;

    @Column({ type: 'uuid' })
    auditorId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'auditorId' })
    auditor!: User;

    @Column({ type: 'text', nullable: true })
    findings?: string;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    complianceScoreAtTime?: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
