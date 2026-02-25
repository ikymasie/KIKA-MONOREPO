import { AlertSeverity } from './RegulatoryAlert';

export enum ComplianceMetric {
    KYC_RATE = 'kyc_rate',
    FINANCIAL_TIMELINESS = 'financial_timeliness',
    BYLAW_ADHERENCE = 'bylaw_adherence',
    OPEN_ISSUES = 'open_issues',
    COMPLIANCE_SCORE = 'compliance_score',
}

export enum ComparisonOperator {
    LESS_THAN = 'less_than',
    GREATER_THAN = 'greater_than',
    EQUALS = 'equals',
    LESS_THAN_OR_EQUAL = 'less_than_or_equal',
    GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
}
export class ComplianceRule {
    id?: string;
    name?: string;
    metric?: ComplianceMetric;
    operator?: ComparisonOperator;
    threshold?: number;
    severity?: AlertSeverity;
    isActive?: boolean;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
}
