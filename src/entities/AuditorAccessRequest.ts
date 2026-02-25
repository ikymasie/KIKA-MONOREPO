import type { User } from './User';
import type { Tenant } from './Tenant';

export enum AccessRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
}
export class AuditorAccessRequest {
    id?: string;
    auditorId?: string;
    auditor?: User;
    tenantId?: string;
    tenant?: Tenant;
    status?: AccessRequestStatus;
    startDate?: Date;
    endDate?: Date;
    purpose?: string;
    approvedById?: string;
    approvedBy?: User;
    createdAt?: Date;
    updatedAt?: Date;
}
