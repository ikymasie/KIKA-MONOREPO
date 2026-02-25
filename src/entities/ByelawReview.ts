import type { Tenant } from './Tenant';
import type { User } from './User';

export enum ByelawReviewStatus {
    PENDING = 'pending',
    UNDER_REVIEW = 'under_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    REVISION_REQUIRED = 'revision_required',
}
export class ByelawReview {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    bylawDocumentUrl?: string;
    submittedAt?: Date;
    status?: ByelawReviewStatus;
    reviewedBy?: string;
    reviewer?: User;
    reviewedAt?: Date;
    reviewNotes?: string;
    approvalDate?: Date;
    rejectionReason?: string;
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;

    get isPending(): boolean {
        return this.status === ByelawReviewStatus.PENDING || this.status === ByelawReviewStatus.UNDER_REVIEW;
    }

    get isApproved(): boolean {
        return this.status === ByelawReviewStatus.APPROVED;
    }

    get isRejected(): boolean {
        return this.status === ByelawReviewStatus.REJECTED;
    }
}
