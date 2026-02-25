import type { Tenant } from './Tenant';
import type { User } from './User';

export enum AuditStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}
export class ComplianceAudit {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    scheduledDate?: Date;
    completedDate?: Date;
    status?: AuditStatus;
    auditorId?: string;
    auditor?: User;
    findings?: string;
    complianceScoreAtTime?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
