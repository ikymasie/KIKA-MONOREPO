import type { Tenant } from './Tenant';
import type { User } from './User';

export enum ComplianceIssueType {
    BYLAW_VIOLATION = 'bylaw_violation',
    REPORTING_DELAY = 'reporting_delay',
    GOVERNANCE_ISSUE = 'governance_issue',
    FINANCIAL_IRREGULARITY = 'financial_irregularity',
    KYC_COMPLIANCE = 'kyc_compliance',
    OPERATIONAL_ISSUE = 'operational_issue',
}

export enum ComplianceIssueSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum ComplianceIssueStatus {
    OPEN = 'open',
    INVESTIGATING = 'investigating',
    RESOLVED = 'resolved',
    ESCALATED = 'escalated',
}
export class ComplianceIssue {
    id?: string;
    tenantId?: string;
    tenant?: Tenant;
    issueType?: ComplianceIssueType;
    severity?: ComplianceIssueSeverity;
    status?: ComplianceIssueStatus;
    description?: string;
    identifiedBy?: string;
    identifier?: User;
    identifiedDate?: Date;
    resolutionDate?: Date;
    resolutionNotes?: string;
    attachments?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
