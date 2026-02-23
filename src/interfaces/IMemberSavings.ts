/**
 * src/interfaces/IMemberSavings.ts
 *
 * Plain TypeScript interfaces for the `member_savings` and `savings_products` tables.
 */

export enum SavingsProductStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export interface IWithdrawalRestrictions {
    maxWithdrawalsPerMonth?: number;
    minBalanceAfterWithdrawal?: number;
    noticePeriodDays?: number;
}

export interface ISavingsProduct {
    id: string;
    tenantId: string;
    name: string;
    code: string;
    description?: string;
    interestRate: number;
    minimumBalance: number;
    maximumBalance?: number;
    isShareCapital: boolean;
    allowWithdrawals: boolean;
    minMonthlyContribution: number;
    withdrawalRestrictions?: IWithdrawalRestrictions;
    interestEarningThreshold: number;
    status: SavingsProductStatus;
    flyerUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IMemberSavings {
    id: string;
    memberId: string;
    productId: string;
    balance: number;
    monthlyContribution: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    // Joined fields (optional – populated by getSavingsWithProduct)
    productName?: string;
    productCode?: string;
    isShareCapital?: boolean;
    allowWithdrawals?: boolean;
}

export interface ISavingsCreateInput {
    memberId: string;
    productId: string;
    balance?: number;
    monthlyContribution?: number;
}

export type ISavingsUpdateInput = Partial<Pick<IMemberSavings,
    'balance' | 'monthlyContribution' | 'isActive'
>>;
