import type { Tenant } from './Tenant';

export enum ProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}
export class SavingsProduct {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    name?: string;
    code?: string;
    description?: string;
    interestRate?: number;
    minimumBalance?: number;
    maximumBalance?: number;
    isShareCapital?: boolean;
    allowWithdrawals?: boolean;
    minMonthlyContribution?: number;
    withdrawalRestrictions?: {
        maxWithdrawalsPerMonth?: number;
        minBalanceAfterWithdrawal?: number;
        noticePeriodDays?: number;
    };
    interestEarningThreshold?: number;
    status?: ProductStatus;
    flyerUrl?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
