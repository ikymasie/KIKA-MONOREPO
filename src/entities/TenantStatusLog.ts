import type { Tenant } from './Tenant';
import { TenantStatus } from './Tenant';
import type { User } from './User';
export class TenantStatusLog {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    previousStatus?: TenantStatus;
    newStatus?: TenantStatus;
    reason?: string;
    changedBy?: string;
    changer?: User;
    changedAt?: Date;
    effectiveDate?: Date;
    createdAt?: Date;
}
