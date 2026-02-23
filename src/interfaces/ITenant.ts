/**
 * src/interfaces/ITenant.ts
 *
 * Plain TypeScript interface for the `tenants` table row.
 * Used by TenantService and any code that works with raw SQL results.
 */

export enum TenantStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    INACTIVE = 'inactive',
}

export interface ITenantKycConfiguration {
    documentChecklist: string[];
    customFields: Array<{ name: string; type: string; required: boolean }>;
}

export interface ITenantBrandingSettings {
    sidebarTheme?: 'light' | 'dark' | 'custom';
    accentColor?: string;
    faviconUrl?: string;
}

export interface ITenantWorkflowConfiguration {
    makerCheckerEnabled: boolean;
    approvalHierarchy: string[];
}

export interface ITenant {
    id: string;
    name: string;
    code: string;
    status: TenantStatus;
    registrationNumber?: string;
    registrationDate?: string;
    address?: string;
    phone?: string;
    email?: string;
    bylaws?: Record<string, unknown>;
    maxBorrowingLimit: number;
    regulatorDeductionCap?: number;
    maxDeductionPercentage: number;
    liquidityRatioTarget: number;
    kycConfiguration?: ITenantKycConfiguration;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    brandingSettings?: ITenantBrandingSettings;
    workflowConfiguration?: ITenantWorkflowConfiguration;
    currentComplianceScore?: number;
    complianceRating?: string;
    lastComplianceReviewDate?: string;
    isMaintenanceMode: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Fields allowed in a PATCH/update call. */
export type ITenantUpdateInput = Partial<
    Pick<
        ITenant,
        | 'name'
        | 'address'
        | 'phone'
        | 'email'
        | 'registrationNumber'
        | 'maxBorrowingLimit'
        | 'maxDeductionPercentage'
        | 'regulatorDeductionCap'
        | 'liquidityRatioTarget'
        | 'kycConfiguration'
        | 'workflowConfiguration'
        | 'logoUrl'
        | 'primaryColor'
        | 'secondaryColor'
        | 'brandingSettings'
        | 'bylaws'
        | 'status'
        | 'isMaintenanceMode'
        | 'currentComplianceScore'
        | 'complianceRating'
        | 'lastComplianceReviewDate'
    >
>;
