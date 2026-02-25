import type { User } from './User';
export class RegulatorSettings {
    id?: string;
    saccosApplicationFee?: number;
    cooperativeApplicationFee?: number;
    religiousSocietyApplicationFee?: number;
    generalSocietyApplicationFee?: number;
    burialSocietyApplicationFee?: number;

    // Annual Fees
    annualReturnFee?: number;

    // Penalties
    lateFilingPenaltyFee?: number;

    // Administrative Fees
    changeOfNameFee?: number;
    changeOfOfficersFee?: number;
    inspectionFee?: number;
    certifiedCopyFee?: number;

    // Compliance Thresholds
    excellentThreshold?: number;
    goodThreshold?: number;
    fairThreshold?: number;
    poorThreshold?: number;

    // Workflow Configuration: Maps application stages to responsible user roles
    workflowConfig?: Record<string, string>; // e.g., { "security_vetting": "intelligence_liaison", "legal_review": "legal_officer" }
    updatedById?: string;
    updatedBy?: User;
    updatedAt?: Date;
}
