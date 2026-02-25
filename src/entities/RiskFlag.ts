import type { SecurityScreening } from './SecurityScreening';
import type { Tenant } from './Tenant';
import type { User } from './User';

export enum RiskFlagType {
    IDENTITY = 'identity',
    FINANCIAL = 'financial',
    POLITICAL = 'political',
    REPUTATIONAL = 'reputational',
    OTHER = 'other',
}
export class RiskFlag {
    id?: string;
    screeningId?: string;
    screening?: SecurityScreening;
    type?: RiskFlagType;
    description?: string;
    isResolved?: boolean;
    resolvedAt?: Date;
    resolvedById?: string;
    resolvedBy?: User;
    tenantId?: string;
    tenant?: Tenant;
    createdAt?: Date;
    updatedAt?: Date;
}
