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
export class Loan {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    loanNumber?: string;
    memberId?: string;
    member?: Member;
    productId?: string;
    product?: LoanProduct;
    principalAmount?: number;
    interestRate?: number;
    termMonths?: number;
    monthlyInstallment?: number;
    processingFee?: number;
    insuranceFee?: number;
    totalAmountDue?: number;
    amountPaid?: number;
    outstandingBalance?: number;
    status?: LoanStatus;
    applicationDate?: Date;
    approvalDate?: Date;
    disbursementDate?: Date;
    maturityDate?: Date;
    approvedBy?: string;
    disbursedBy?: string;
    purpose?: string;
    rejectionReason?: string;
    workflowStage?: WorkflowStage;
    eligibilityCheckPassed?: boolean;
    eligibilityCheckNotes?: {
        savingsRatioCheck?: { passed: boolean; details: string };
        activeLoanCheck?: { passed: boolean; details: string };
        membershipDurationCheck?: { passed: boolean; details: string };
        timestamp?: Date;
    };
    loanOfficerId?: string;
    loanOfficerNotes?: string;
    loanOfficerReviewDate?: Date;
    committeeApprovalDate?: Date;
    committeeVotes?: Array<{
        userId: string;
        vote: 'approve' | 'reject';
        notes?: string;
        timestamp: Date;
    }>;
    deductionScheduled?: boolean;
    deductionScheduledAt?: Date;
    guarantors?: LoanGuarantor[];
    createdAt?: Date;
    updatedAt?: Date;

    get isPastDue(): boolean {
        if (!this.maturityDate || this.status !== LoanStatus.ACTIVE) return false;
        return new Date() > new Date(this.maturityDate);
    }
}
