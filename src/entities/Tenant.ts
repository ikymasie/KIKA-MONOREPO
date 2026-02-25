import type { User } from './User';
import type { Member } from './Member';
import type { SavingsProduct } from './SavingsProduct';
import type { LoanProduct } from './LoanProduct';
import type { InsuranceProduct } from './InsuranceProduct';
import type { MerchandiseProduct } from './MerchandiseProduct';
import type { DeductionRequest } from './DeductionRequest';
import type { Account } from './Account';

export enum TenantStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    INACTIVE = 'inactive',
}
export class Tenant {
    id?: string;
    name?: string;
    code?: string;
    status?: TenantStatus;
    registrationNumber?: string;
    registrationDate?: Date;
    address?: string;
    phone?: string;
    email?: string;
    bylaws?: Record<string, any>;
    maxBorrowingLimit?: number;
    regulatorDeductionCap?: number;
    maxDeductionPercentage?: number;
    liquidityRatioTarget?: number;
    kycConfiguration?: {
        documentChecklist: string[];
        customFields: Array<{ name: string; type: string; required: boolean }>;
    };
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    brandingSettings?: {
        sidebarTheme?: 'light' | 'dark' | 'custom';
        accentColor?: string;
        faviconUrl?: string;
    };
    workflowConfiguration?: {
        makerCheckerEnabled: boolean;
        approvalHierarchy: string[];
    };
    currentComplianceScore?: number;
    complianceRating?: string;
    lastComplianceReviewDate?: Date;
    isMaintenanceMode?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    users?: User[];
    members?: Member[];
    savingsProducts?: SavingsProduct[];
    loanProducts?: LoanProduct[];
    insuranceProducts?: InsuranceProduct[];
    merchandiseProducts?: MerchandiseProduct[];
    deductionRequests?: DeductionRequest[];
    accounts?: Account[];
}
