import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Tenant } from './Tenant';
import { User } from './User';

export enum ComplianceRating {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor',
    CRITICAL = 'critical',
}

@Entity('compliance_scores')
@Index(['tenantId'])
@Index(['calculatedAt'])
@Index(['rating'])
export class ComplianceScore {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    overallScore!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    kycScore!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    reportingScore!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    bylawScore!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    issueScore!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    alertScore!: number;

    @Column({ type: 'enum', enum: ComplianceRating })
    rating!: ComplianceRating;

    @Column({ type: 'timestamp' })
    calculatedAt!: Date;

    @Column({ type: 'uuid' })
    calculatedBy!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'calculatedBy' })
    calculator!: User;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @CreateDateColumn()
    createdAt!: Date;

    static getRatingFromScore(score: number): ComplianceRating {
        if (score >= 90) return ComplianceRating.EXCELLENT;
        if (score >= 75) return ComplianceRating.GOOD;
        if (score >= 60) return ComplianceRating.FAIR;
        if (score >= 40) return ComplianceRating.POOR;
        return ComplianceRating.CRITICAL;
    }
}
