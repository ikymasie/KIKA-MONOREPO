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

export enum ComplianceIssueType {
    BYLAW_VIOLATION = 'bylaw_violation',
    REPORTING_DELAY = 'reporting_delay',
    GOVERNANCE_ISSUE = 'governance_issue',
    FINANCIAL_IRREGULARITY = 'financial_irregularity',
    KYC_COMPLIANCE = 'kyc_compliance',
    OPERATIONAL_ISSUE = 'operational_issue',
}

export enum ComplianceIssueSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum ComplianceIssueStatus {
    OPEN = 'open',
    INVESTIGATING = 'investigating',
    RESOLVED = 'resolved',
    ESCALATED = 'escalated',
}

@Entity('compliance_issues')
@Index(['tenantId'])
@Index(['status'])
@Index(['severity'])
export class ComplianceIssue {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne('Tenant', { nullable: false })
    @JoinColumn({ name: 'tenantId' })
    tenant!: any;

    @Column({ type: 'enum', enum: ComplianceIssueType })
    issueType!: ComplianceIssueType;

    @Column({ type: 'enum', enum: ComplianceIssueSeverity })
    severity!: ComplianceIssueSeverity;

    @Column({ type: 'enum', enum: ComplianceIssueStatus, default: ComplianceIssueStatus.OPEN })
    status!: ComplianceIssueStatus;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'uuid' })
    identifiedBy!: string;

    @ManyToOne('User', { nullable: false })
    @JoinColumn({ name: 'identifiedBy' })
    identifier!: any;

    @Column({ type: 'timestamp' })
    identifiedDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    resolutionDate?: Date;

    @Column({ type: 'text', nullable: true })
    resolutionNotes?: string;

    @Column({ type: 'json', nullable: true })
    attachments?: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
