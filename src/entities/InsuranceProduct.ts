import type { Tenant } from './Tenant';

export enum InsuranceProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum CoverageType {
    INDIVIDUAL = 'individual',
    FAMILY = 'family',
    EXTENDED = 'extended',
}
export class InsuranceProduct {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    name?: string;
    code?: string;
    description?: string;
    coverageType?: CoverageType;
    monthlyPremium?: number;
    coverageAmount?: number;
    waitingPeriodMonths?: number;
    maxDependents?: number;
    maxDependentAge?: number;
    underwriter?: string;
    policyNumber?: string;
    status?: InsuranceProductStatus;
    flyerUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
