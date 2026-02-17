/**
 * Notification System Type Definitions
 * 
 * Defines all notification events, channels, priorities, and statuses
 * for the comprehensive role-based notification system.
 */

export enum NotificationEvent {
    // Member Tier (8 events)
    MEMBER_LOGIN_OTP = 'member_login_otp',
    MEMBER_DEPOSIT_RECEIVED = 'member_deposit_received',
    MEMBER_DEDUCTION_PROCESSED = 'member_deduction_processed',
    MEMBER_LOAN_APPLICATION = 'member_loan_application',
    MEMBER_LOAN_DECISION = 'member_loan_decision',
    MEMBER_GUARANTOR_REQUEST = 'member_guarantor_request',
    MEMBER_CLAIM_STATUS = 'member_claim_status',
    MEMBER_MISSED_PAYMENT = 'member_missed_payment',

    // Tenant Tier - SACCOS Admin (3 events)
    SACCOS_SYSTEM_ALERT = 'saccos_system_alert',
    SACCOS_STAFF_CREATED = 'saccos_staff_created',
    SACCOS_LICENSE_EXPIRY = 'saccos_license_expiry',

    // Tenant Tier - Loan Officer (2 events)
    LOAN_OFFICER_NEW_APPLICATION = 'loan_officer_new_application',
    LOAN_OFFICER_DOCUMENT_MISSING = 'loan_officer_document_missing',

    // Tenant Tier - Accountant (3 events)
    ACCOUNTANT_SUSPENSE_ALERT = 'accountant_suspense_alert',
    ACCOUNTANT_BANK_SYNC_FAIL = 'accountant_bank_sync_fail',
    ACCOUNTANT_PAYROLL_MISMATCH = 'accountant_payroll_mismatch',

    // Tenant Tier - Member Service Rep (2 events)
    MEMBER_SERVICE_NEW_MEMBER = 'member_service_new_member',
    MEMBER_SERVICE_TICKET_ASSIGNED = 'member_service_ticket_assigned',

    // Tenant Tier - Credit Committee (2 events)
    CREDIT_COMMITTEE_APPROVAL_REQUEST = 'credit_committee_approval_request',
    CREDIT_COMMITTEE_MEETING_REMINDER = 'credit_committee_meeting_reminder',

    // DCD Tier - Department of Co-operative Development (3 events)
    DCD_DIRECTOR_CRITICAL_FAILURE = 'dcd_director_critical_failure',
    DCD_DIRECTOR_FRAUD_ALERT = 'dcd_director_fraud_alert',
    DCD_COMPLIANCE_NON_COMPLIANCE = 'dcd_compliance_non_compliance',

    // BoB Tier - Bank of Botswana (3 events)
    BOB_SUPERVISOR_LIQUIDITY_ALERT = 'bob_supervisor_liquidity_alert',
    BOB_AUDITOR_AUDIT_ASSIGNED = 'bob_auditor_audit_assigned',
    BOB_COMPLIANCE_CAPITAL_BREACH = 'bob_compliance_capital_breach',

    // Shared Regulatory Functions (2 events)
    DEDUCTION_OFFICER_SUBMISSION_READY = 'deduction_officer_submission_ready',
    DEDUCTION_OFFICER_RECON_COMPLETED = 'deduction_officer_recon_completed',

    // Government Officers (6 events)
    REGISTRY_CLERK_NEW_APPLICATION = 'registry_clerk_new_application',
    INTELLIGENCE_LIAISON_VETTING_REQUEST = 'intelligence_liaison_vetting_request',
    LEGAL_OFFICER_REVIEW_REQUEST = 'legal_officer_review_request',
    REGISTRAR_FINAL_DECISION = 'registrar_final_decision',
    DIRECTOR_COOPERATIVES_VIABILITY_REVIEW = 'director_cooperatives_viability_review',
    MINISTER_DELEGATE_APPEAL_LODGED = 'minister_delegate_appeal_lodged',

    // Applicants (5 events)
    SOCIETY_APPLICANT_APP_RECEIVED = 'society_applicant_app_received',
    SOCIETY_APPLICANT_QUERY_RAISED = 'society_applicant_query_raised',
    SOCIETY_APPLICANT_OUTCOME = 'society_applicant_outcome',
    COOPERATIVE_APPLICANT_VIABILITY_CHECK = 'cooperative_applicant_viability_check',
    COOPERATIVE_APPLICANT_INSPECTION = 'cooperative_applicant_inspection',

    // External Users (4 events)
    EXTERNAL_AUDITOR_INVITE = 'external_auditor_invite',
    EXTERNAL_AUDITOR_REPORT_DUE = 'external_auditor_report_due',
    VENDOR_PO_RECEIVED = 'vendor_po_received',
    VENDOR_PAYMENT_SENT = 'vendor_payment_sent',
    MEMBER_ORDER_STATUS_UPDATE = 'member_order_status_update',
    VENDOR_NEW_ORDER = 'vendor_new_order',
}

export enum NotificationChannel {
    SMS = 'sms',
    EMAIL = 'email',
}

export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export enum NotificationStatus {
    PENDING = 'pending',
    SENT = 'sent',
    FAILED = 'failed',
    RETRYING = 'retrying',
}

export interface NotificationContext {
    event: NotificationEvent;
    recipientRole: string; // UserRole
    recipientEmail?: string;
    recipientPhone?: string;
    recipientName?: string;
    userId?: string;
    tenantId?: string;
    data: Record<string, any>; // Template placeholders
}

export interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    details?: any;
}

export interface BulkEmailResponse {
    success: boolean;
    results: Array<{
        to: string;
        success: boolean;
        messageId?: string;
        error?: string;
    }>;
}
