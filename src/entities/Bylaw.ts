import type { Tenant } from './Tenant';
import type { User } from './User';

export enum BylawStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}
export class Bylaw {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    version?: string;
    submittedDate?: Date;
    status?: BylawStatus;
    documentUrl?: string;
    content?: Record<string, any>;
    approvedBy?: string;
    approver?: User;
    approvedDate?: Date;
    effectiveDate?: Date;
    rejectionReason?: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
