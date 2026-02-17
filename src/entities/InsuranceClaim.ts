import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { InsurancePolicy } from './InsurancePolicy';
import { Tenant } from './Tenant';


export enum ClaimStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    IN_REVIEW = 'in_review',
    PENDING_APPROVAL = 'pending_approval',
    QUERIED = 'queried',
    APPROVED = 'approved',
    PAID = 'paid',
    REJECTED = 'rejected',
    UNDER_APPEAL = 'under_appeal',
    APPEAL_DECLINED = 'appeal_declined',
    COMMITTEE_REVIEW = 'committee_review',
    REGULATOR_REVIEW = 'regulator_review',
    FINAL_REJECTION = 'final_rejection',
}

export enum ClaimType {
    DEATH = 'death',
    DISABILITY = 'disability',
    CRITICAL_ILLNESS = 'critical_illness',
    OTHER = 'other',
}

@Entity('insurance_claims')
export class InsuranceClaim {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    claimNumber!: string;

    @Column({ type: 'uuid' })
    policyId!: string;

    @ManyToOne(() => InsurancePolicy, (policy) => policy.claims)
    @JoinColumn({ name: 'policyId' })
    policy!: InsurancePolicy;

    @Column({ type: 'enum', enum: ClaimType })
    claimType!: ClaimType;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    claimAmount!: number;

    @Column({ type: 'date' })
    incidentDate!: Date;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'json', nullable: true })
    supportingDocuments?: string[];

    @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.SUBMITTED })
    status!: ClaimStatus;

    // Workflow Tracking
    @Column({ type: 'uuid', nullable: true })
    verifiedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    verifiedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    adjudicatedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    adjudicatedAt?: Date;

    @Column({ type: 'uuid', nullable: true })
    disbursedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    disbursedAt?: Date;

    // Dispute Resolution
    @Column({ type: 'text', nullable: true })
    disputeReason?: string;

    @Column({ type: 'json', nullable: true })
    disputeEvidenceUrls?: string[];

    @Column({ type: 'text', nullable: true })
    committeeReviewNotes?: string;

    @Column({ type: 'text', nullable: true })
    regulatorRuling?: string;

    @Column({ type: 'boolean', default: false })
    isExGratia!: boolean;

    @Column({ type: 'text', nullable: true })
    queryReason?: string;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    approvedAmount?: number;

    @Column({ type: 'timestamp', nullable: true })
    paidAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
