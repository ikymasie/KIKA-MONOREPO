import type { InsurancePolicy } from './InsurancePolicy';
import type { Tenant } from './Tenant';

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
export class InsuranceClaim {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    claimNumber?: string;
    policyId?: string;
    policy?: InsurancePolicy;
    claimType?: ClaimType;
    claimAmount?: number;
    incidentDate?: Date;
    description?: string;
    supportingDocuments?: string[];
    status?: ClaimStatus;
    verifiedBy?: string;
    verifiedAt?: Date;
    adjudicatedBy?: string;
    adjudicatedAt?: Date;
    disbursedBy?: string;
    disbursedAt?: Date;
    disputeReason?: string;
    disputeEvidenceUrls?: string[];
    committeeReviewNotes?: string;
    regulatorRuling?: string;
    isExGratia?: boolean;
    queryReason?: string;
    rejectionReason?: string;
    approvedAmount?: number;
    paidAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
