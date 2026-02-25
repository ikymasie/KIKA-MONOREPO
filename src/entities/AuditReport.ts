import type { AuditorAccessRequest } from './AuditorAccessRequest';

export enum AuditReportStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
}
export class AuditReport {
    id?: string;
    requestId?: string;
    request?: AuditorAccessRequest;
    fileName?: string;
    fileUrl?: string;
    status?: AuditReportStatus;
    submittedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
