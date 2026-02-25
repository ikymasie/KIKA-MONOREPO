import type { Tenant } from './Tenant';

export enum AlertSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export enum AlertType {
    LIQUIDITY_BREACH = 'liquidity_breach',
    HIGH_RISK_RATING = 'high_risk_rating',
    LATE_FILING = 'late_filing',
    COMPLIANCE_ISSUE = 'compliance_issue',
    CAPITAL_ADEQUACY = 'capital_adequacy',
    LOW_COMPLIANCE_SCORE = 'low_compliance_score',
    PENDING_KYC_VERIFICATION = 'pending_kyc_verification',
    OVERDUE_BYELAW_REVIEW = 'overdue_byelaw_review'
}
export class RegulatoryAlert {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    type?: AlertType;
    severity?: AlertSeverity;
    title?: string;
    description?: string;
    metadata?: Record<string, any>;
    isResolved?: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
    createdAt?: Date;
}
