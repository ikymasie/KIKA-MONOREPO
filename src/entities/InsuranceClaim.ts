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
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PAID = 'paid',
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

    @Column({ type: 'uuid', nullable: true })
    reviewedBy?: string;

    @Column({ type: 'timestamp', nullable: true })
    reviewedAt?: Date;

    @Column({ type: 'text', nullable: true })
    reviewNotes?: string;

    @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
    approvedAmount?: number;

    @Column({ type: 'timestamp', nullable: true })
    paidAt?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
