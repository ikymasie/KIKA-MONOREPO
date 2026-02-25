import type { Tenant } from './Tenant';
import type { User } from './User';

export enum ComplianceRating {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    FAIR = 'fair',
    POOR = 'poor',
    CRITICAL = 'critical',
}
export class ComplianceScore {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    overallScore?: number;
    kycScore?: number;
    reportingScore?: number;
    bylawScore?: number;
    issueScore?: number;
    alertScore?: number;
    rating?: ComplianceRating;
    calculatedAt?: Date;
    calculatedBy?: string;
    calculator?: User;
    notes?: string;
    createdAt?: Date;

    static getRatingFromScore(score: number): ComplianceRating {
        if (score >= 90) return ComplianceRating.EXCELLENT;
        if (score >= 75) return ComplianceRating.GOOD;
        if (score >= 60) return ComplianceRating.FAIR;
        if (score >= 40) return ComplianceRating.POOR;
        return ComplianceRating.CRITICAL;
    }
}
