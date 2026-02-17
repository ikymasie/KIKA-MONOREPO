import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { AlertSeverity } from './RegulatoryAlert';

export enum ComplianceMetric {
    KYC_RATE = 'kyc_rate',
    FINANCIAL_TIMELINESS = 'financial_timeliness',
    BYLAW_ADHERENCE = 'bylaw_adherence',
    OPEN_ISSUES = 'open_issues',
    COMPLIANCE_SCORE = 'compliance_score',
}

export enum ComparisonOperator {
    LESS_THAN = 'less_than',
    GREATER_THAN = 'greater_than',
    EQUALS = 'equals',
    LESS_THAN_OR_EQUAL = 'less_than_or_equal',
    GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
}

@Entity('compliance_rules')
export class ComplianceRule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'enum', enum: ComplianceMetric })
    metric!: ComplianceMetric;

    @Column({ type: 'enum', enum: ComparisonOperator })
    operator!: ComparisonOperator;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    threshold!: number;

    @Column({ type: 'enum', enum: AlertSeverity })
    severity!: AlertSeverity;

    @Column({ type: 'boolean', default: true })
    isActive!: boolean;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
