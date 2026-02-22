import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import type { Member } from './Member';
import type { LoanProduct } from './LoanProduct';
import type { LoanGuarantor } from './LoanGuarantor';
import type { Tenant } from './Tenant';



export enum LoanStatus {
    // Workflow stages
    DRAFT = 'draft',
    PENDING_GUARANTORS = 'pending_guarantors',
    UNDER_APPRAISAL = 'under_appraisal',
    AWAITING_COMMITTEE = 'awaiting_committee',
    COMMITTEE_APPROVED = 'committee_approved',

    // Legacy/simple workflow
    PENDING = 'pending',
    APPROVED = 'approved',

    // Post-approval stages
    DISBURSED = 'disbursed',
    ACTIVE = 'active',

    // Terminal states
    PAID_OFF = 'paid_off',
    DEFAULTED = 'defaulted',
    WRITTEN_OFF = 'written_off',
    REJECTED = 'rejected',
}

export enum WorkflowStage {
    ELIGIBILITY_CHECK = 'eligibility_check',
    GUARANTOR_STAKING = 'guarantor_staking',
    TECHNICAL_APPRAISAL = 'technical_appraisal',
    COMMITTEE_APPROVAL = 'committee_approval',
    DISBURSEMENT = 'disbursement',
    COMPLETED = 'completed',
}

@Entity('loans')
export class Loan {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    tenantId!: string;

    @ManyToOne(() => require('./Tenant').Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant!: Tenant;

    @Column()
    loanNumber!: string;

    @Column({ type: 'uuid' })
    memberId!: string;

    @ManyToOne(() => require('./Member').Member, (member: Member) => member.loans)
    @JoinColumn({ name: 'memberId' })
    member!: Member;

    @Column({ type: 'uuid' })
    productId!: string;

    @ManyToOne(() => require('./LoanProduct').LoanProduct)
    @JoinColumn({ name: 'productId' })
    product!: LoanProduct;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    principalAmount!: number;

    @Column({ type: 'decimal', precision: 5, scale: 2 })
    interestRate!: number;

    @Column({ type: 'int' })
    termMonths!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    monthlyInstallment!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    processingFee!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    insuranceFee!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    totalAmountDue!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    amountPaid!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
    outstandingBalance!: number;

    @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.PENDING })
    status!: LoanStatus;

    @Column({ type: 'date', nullable: true })
    applicationDate?: Date;

    @Column({ type: 'date', nullable: true })
    approvalDate?: Date;

    @Column({ type: 'date', nullable: true })
    disbursementDate?: Date;

    @Column({ type: 'date', nullable: true })
    maturityDate?: Date;

    @Column({ type: 'uuid', nullable: true })
    approvedBy?: string;

    @Column({ type: 'uuid', nullable: true })
    disbursedBy?: string;

    @Column({ type: 'text', nullable: true })
    purpose?: string;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    // Workflow tracking fields
    @Column({ type: 'enum', enum: WorkflowStage, nullable: true })
    workflowStage?: WorkflowStage;

    @Column({ type: 'boolean', default: false })
    eligibilityCheckPassed!: boolean;

    @Column({ type: 'json', nullable: true })
    eligibilityCheckNotes?: {
        savingsRatioCheck?: { passed: boolean; details: string };
        activeLoanCheck?: { passed: boolean; details: string };
        membershipDurationCheck?: { passed: boolean; details: string };
        timestamp?: Date;
    };

    @Column({ type: 'uuid', nullable: true })
    loanOfficerId?: string;

    @Column({ type: 'text', nullable: true })
    loanOfficerNotes?: string;

    @Column({ type: 'timestamp', nullable: true })
    loanOfficerReviewDate?: Date;

    @Column({ type: 'timestamp', nullable: true })
    committeeApprovalDate?: Date;

    @Column({ type: 'json', nullable: true })
    committeeVotes?: Array<{
        userId: string;
        vote: 'approve' | 'reject';
        notes?: string;
        timestamp: Date;
    }>;

    @Column({ type: 'boolean', default: false })
    deductionScheduled!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    deductionScheduledAt?: Date;

    @OneToMany(() => require('./LoanGuarantor').LoanGuarantor, (guarantor: LoanGuarantor) => guarantor.loan, { cascade: true })
    guarantors!: LoanGuarantor[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    get isPastDue(): boolean {
        if (!this.maturityDate || this.status !== LoanStatus.ACTIVE) return false;
        return new Date() > new Date(this.maturityDate);
    }
}
