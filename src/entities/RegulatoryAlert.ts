import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Tenant } from './Tenant';

export enum AlertSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum AlertType {
    LIQUIDITY_BREACH = 'liquidity_breach',
    HIGH_RISK_RATING = 'high_risk_rating',
    LATE_FILING = 'late_filing',
    COMPLIANCE_ISSUE = 'compliance_issue',
    CAPITAL_ADEQUACY = 'capital_adequacy',
    LOW_COMPLIANCE_SCORE = 'low_compliance_score',
    PENDING_KYC_VERIFICATION = 'pending_kyc_verification',
    OVERDUE_BYELAW_REVIEW = 'overdue_byelaw_review'
}

@Entity('regulatory_alerts')
@Index(['tenantId'])
@Index(['severity'])
@Index(['isResolved'])
@Index(['createdAt'])
export class RegulatoryAlert {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({
        type: 'enum',
        enum: AlertType
    })
    type!: AlertType;

    @Column({
        type: 'enum',
        enum: AlertSeverity
    })
    severity!: AlertSeverity;

    @Column({ type: 'varchar', length: 255 })
    title!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'json', nullable: true })
    metadata?: Record<string, any>;

    @Column({ type: 'boolean', default: false })
    isResolved!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    resolvedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    resolvedBy?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
