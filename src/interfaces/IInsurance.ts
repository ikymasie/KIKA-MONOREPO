export enum InsuranceProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum CoverageType {
    INDIVIDUAL = 'individual',
    FAMILY = 'family',
    EXTENDED = 'extended',
}

export interface IInsuranceProduct {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    description?: string | null;
    coverageType: CoverageType;
    monthlyPremium: number;
    coverageAmount: number;
    waitingPeriodMonths: number;
    maxDependents?: number | null;
    maxDependentAge?: number | null;
    underwriter?: string | null;
    policyNumber?: string | null;
    status: InsuranceProductStatus;
    flyerUrl?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export enum PolicyStatus {
    ACTIVE = 'active',
    WAITING_PERIOD = 'waiting_period',
    LAPSED = 'lapsed',
    CANCELLED = 'cancelled',
}

export interface IInsurancePolicy {
    id: string;
    tenantId: string;
    policyNumber: string;
    memberId: string;
    productId: string;
    monthlyPremium: number;
    coverageAmount: number;
    startDate: string | Date;
    endDate?: string | Date | null;
    waitingPeriodEndDate?: string | Date | null;
    status: PolicyStatus;
    monthsPaid: number;
    createdAt: Date;
    updatedAt: Date;

    // Virtual
    productName?: string;
    memberFullName?: string;
}

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

export interface IInsuranceClaim {
    id: string;
    tenantId: string;
    claimNumber: string;
    policyId: string;
    claimType: ClaimType;
    claimAmount: number;
    incidentDate: string | Date;
    description: string;
    supportingDocuments?: string[] | null;
    status: ClaimStatus;

    verifiedBy?: string | null;
    verifiedAt?: Date | null;
    adjudicatedBy?: string | null;
    adjudicatedAt?: Date | null;
    disbursedBy?: string | null;
    disbursedAt?: Date | null;

    disputeReason?: string | null;
    disputeEvidenceUrls?: string[] | null;
    committeeReviewNotes?: string | null;
    regulatorRuling?: string | null;

    isExGratia: boolean;
    queryReason?: string | null;
    rejectionReason?: string | null;
    approvedAmount?: number | null;
    paidAt?: Date | null;

    createdAt: Date;
    updatedAt: Date;

    // Virtual joined fields
    policyNumber?: string;
    memberFullName?: string;
    premiumAmount?: number;
}
