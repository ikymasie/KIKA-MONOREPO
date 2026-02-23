/**
 * src/interfaces/ILoan.ts
 *
 * Plain TypeScript interfaces for the `loans` and `loan_products` tables.
 */

export enum LoanStatus {
    DRAFT = 'draft',
    PENDING_GUARANTORS = 'pending_guarantors',
    UNDER_APPRAISAL = 'under_appraisal',
    AWAITING_COMMITTEE = 'awaiting_committee',
    COMMITTEE_APPROVED = 'committee_approved',
    PENDING = 'pending',
    APPROVED = 'approved',
    DISBURSED = 'disbursed',
    ACTIVE = 'active',
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

export enum LoanProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum InterestCalculationMethod {
    FLAT_RATE = 'flat_rate',
    REDUCING_BALANCE = 'reducing_balance',
    COMPOUND_INTEREST = 'compound_interest',
}

export interface IEligibilityCheckNotes {
    savingsRatioCheck?: { passed: boolean; details: string };
    activeLoanCheck?: { passed: boolean; details: string };
    membershipDurationCheck?: { passed: boolean; details: string };
    timestamp?: string;
}

export interface ICommitteeVote {
    userId: string;
    vote: 'approve' | 'reject';
    notes?: string;
    timestamp: string;
}

export interface ILoan {
    id: string;
    tenantId: string;
    loanNumber: string;
    memberId: string;
    productId: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyInstallment: number;
    processingFee: number;
    insuranceFee: number;
    totalAmountDue: number;
    amountPaid: number;
    outstandingBalance: number;
    status: LoanStatus;
    applicationDate?: string;
    approvalDate?: string;
    disbursementDate?: string;
    maturityDate?: string;
    approvedBy?: string;
    disbursedBy?: string;
    purpose?: string;
    rejectionReason?: string;
    workflowStage?: WorkflowStage;
    eligibilityCheckPassed: boolean;
    eligibilityCheckNotes?: IEligibilityCheckNotes;
    loanOfficerId?: string;
    loanOfficerNotes?: string;
    loanOfficerReviewDate?: string;
    committeeApprovalDate?: string;
    committeeVotes?: ICommitteeVote[];
    deductionScheduled: boolean;
    deductionScheduledAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ILoanProduct {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    description?: string;
    interestRate: number;
    interestMethod: InterestCalculationMethod;
    minimumAmount: number;
    maximumAmount: number;
    minimumTermMonths: number;
    maximumTermMonths: number;
    requiredGuarantors: number;
    processingFeePercentage?: number;
    insuranceFeePercentage?: number;
    requiresCollateral: boolean;
    penaltyRate?: number;
    savingsMultiplier: number;
    maxDurationMonths: number;
    gracePeriodDays: number;
    status: LoanProductStatus;
    flyerUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ILoanCreateInput {
    tenantId: string;
    memberId: string;
    productId: string;
    loanNumber: string;
    principalAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyInstallment: number;
    processingFee?: number;
    insuranceFee?: number;
    totalAmountDue?: number;
    purpose?: string;
    applicationDate?: string;
    loanOfficerId?: string;
}

export type ILoanUpdateInput = Partial<Pick<ILoan,
    | 'status' | 'workflowStage' | 'approvedBy' | 'approvalDate'
    | 'disbursedBy' | 'disbursementDate' | 'maturityDate'
    | 'rejectionReason' | 'loanOfficerNotes' | 'loanOfficerReviewDate'
    | 'loanOfficerId' | 'eligibilityCheckPassed' | 'eligibilityCheckNotes'
    | 'committeeApprovalDate' | 'committeeVotes'
    | 'amountPaid' | 'outstandingBalance'
    | 'deductionScheduled' | 'deductionScheduledAt'
>>;

export interface ILoanListFilters {
    status?: LoanStatus;
    memberId?: string;
    loanOfficerId?: string;
    search?: string;
}
