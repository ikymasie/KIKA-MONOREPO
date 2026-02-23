export enum AccessRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
    REVOKED = 'revoked',
}

export enum AuditReportStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    REVIEWED = 'reviewed',
    ACCEPTED = 'accepted',
}

export interface IAuditorAccessRequest {
    id: string;
    auditorId: string;
    tenantId: string;
    startDate: Date | string;
    endDate: Date | string;
    purpose: string;
    status: AccessRequestStatus;
    approvedById?: string;
    reasonForRejection?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IAuditWorkingPaper {
    id: string;
    requestId: string;
    fileName: string;
    fileUrl: string;
    uploadedById: string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

export interface IAuditReport {
    id: string;
    requestId: string;
    fileName: string;
    fileUrl: string;
    status: AuditReportStatus;
    submittedAt?: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
}
