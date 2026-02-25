import type { Tenant } from './Tenant';

export enum LoanProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum InterestCalculationMethod {
    FLAT_RATE = 'flat_rate',
    REDUCING_BALANCE = 'reducing_balance',
    COMPOUND_INTEREST = 'compound_interest',
}
export class LoanProduct {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    name?: string;
    code?: string;
    description?: string;
    interestRate?: number;
    interestMethod?: InterestCalculationMethod;
    minimumAmount?: number;
    maximumAmount?: number;
    minimumTermMonths?: number;
    maximumTermMonths?: number;
    requiredGuarantors?: number;
    processingFeePercentage?: number;
    insuranceFeePercentage?: number;
    requiresCollateral?: boolean;
    penaltyRate?: number;
    savingsMultiplier?: number;
    maxDurationMonths?: number;
    gracePeriodDays?: number;
    status?: LoanProductStatus;
    flyerUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
