import type { Tenant } from './Tenant';

export enum ResolutionStatus {
    PENDING = 'pending',
    IMPLEMENTED = 'implemented',
    SUPERSEDED = 'superseded',
    CANCELLED = 'cancelled',
}
export class AgmResolution {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    year?: number;
    date?: Date;
    title?: string;
    description?: string;
    status?: ResolutionStatus;
    meetingMinutesUrl?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}
