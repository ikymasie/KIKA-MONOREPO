import type { Tenant } from './Tenant';
import type { User } from './User';

export enum InvestigationStatus {
    OPEN = 'open',
    UNDER_REVIEW = 'under_review',
    COMPLETED = 'completed',
    CLOSED = 'closed',
}

export enum InvestigationSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}
export class Investigation {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    officerId?: string;
    officer?: User;
    subject?: string;
    description?: string;
    status?: InvestigationStatus;
    severity?: InvestigationSeverity;
    findings?: string;
    recommendations?: string;
    completedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
