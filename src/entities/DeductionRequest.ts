import type { Tenant } from './Tenant';
import type { DeductionItem } from './DeductionItem';

export enum DeductionRequestStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}
export class DeductionRequest {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    batchNumber?: string;
    month?: number;
    year?: number;
    totalMembers?: number;
    totalAmount?: number;
    status?: DeductionRequestStatus;
    csvFileUrl?: string;
    submittedBy?: string;
    submittedAt?: Date;
    notes?: string;
    items?: DeductionItem[];
    createdAt?: Date;
    updatedAt?: Date;
}
