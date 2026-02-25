import type { FieldReport } from './FieldReport';
import type { Tenant } from './Tenant';
import type { User } from './User';

export enum FieldVisitStatus {
    SCHEDULED = 'scheduled',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
}
export class FieldVisit {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    officerId?: string;
    officer?: User;
    scheduledDate?: Date;
    actualDate?: Date;
    status?: FieldVisitStatus;
    purpose?: string;
    notes?: string;
    report?: FieldReport;
    latitude?: number;
    longitude?: number;
    geoLoggedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
