/**
 * Notification Template Definitions
 * 
 * Pre-defined templates for all notification events across all user roles.
 * These will be seeded into the database on first run.
 */

import { NotificationEvent, NotificationChannel, NotificationPriority } from './notification-types';
import { UserRole } from '@/src/entities/User';

export interface TemplateDefinition {
    event: NotificationEvent;
    targetRole: UserRole;
    channels: NotificationChannel[];
    smsTemplate?: string;
    emailSubject?: string;
    emailTemplate?: string;
    placeholders: string[];
    priority: NotificationPriority;
    description: string;
}

export const NOTIFICATION_TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
    // ========================================
    // MEMBER TIER (8 events)
    // ========================================
    {
        event: NotificationEvent.MEMBER_LOGIN_OTP,
        targetRole: UserRole.MEMBER,
        channels: [NotificationChannel.SMS],
        smsTemplate: 'Your KIKA login OTP is: {{otp}}. Valid for 10 minutes. Do not share this code.',
        placeholders: ['otp'],
        priority: NotificationPriority.URGENT,
        description: 'OTP for member login or password reset',
    },
    {
        event: NotificationEvent.MEMBER_DEPOSIT_RECEIVED,
        targetRole: UserRole.MEMBER,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Confirmed: P{{amount}} received in {{accountType}}. New Bal: P{{newBalance}}.',
        emailSubject: 'Deposit Confirmation - P{{amount}}',
        emailTemplate: `
            <h2>Deposit Received</h2>
            <p>Dear {{memberName}},</p>
            <p>We confirm receipt of your deposit:</p>
            <ul>
                <li><strong>Amount:</strong> P{{amount}}</li>
                <li><strong>Account:</strong> {{accountType}}</li>
                <li><strong>New Balance:</strong> P{{newBalance}}</li>
                <li><strong>Date:</strong> {{date}}</li>
                <li><strong>Reference:</strong> {{reference}}</li>
            </ul>
            <p>Thank you for your continued trust in KIKA.</p>
        `,
        placeholders: ['amount', 'accountType', 'newBalance', 'date', 'reference', 'memberName'],
        priority: NotificationPriority.HIGH,
        description: 'Notification when member deposit is received',
    },
    {
        event: NotificationEvent.MEMBER_DEDUCTION_PROCESSED,
        targetRole: UserRole.MEMBER,
        channels: [NotificationChannel.SMS],
        smsTemplate: 'Your monthly contribution of P{{amount}} via Payroll was successful.',
        placeholders: ['amount'],
        priority: NotificationPriority.MEDIUM,
        description: 'Confirmation of payroll deduction processing',
    },
    {
        event: NotificationEvent.MEMBER_LOAN_APPLICATION,
        targetRole: UserRole.MEMBER,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Loan App #{{loanId}} received. Under review by Credit Committee.',
        emailSubject: 'Loan Application Received - #{{loanId}}',
        emailTemplate: `
            <h2>Loan Application Received</h2>
            <p>Dear {{memberName}},</p>
            <p>We have received your loan application and it is now under review.</p>
            <ul>
                <li><strong>Application ID:</strong> {{loanId}}</li>
                <li><strong>Amount Requested:</strong> P{{amount}}</li>
                <li><strong>Purpose:</strong> {{purpose}}</li>
                <li><strong>Status:</strong> Under Review</li>
            </ul>
            <p>You will be notified once a decision has been made.</p>
        `,
        placeholders: ['loanId', 'memberName', 'amount', 'purpose'],
        priority: NotificationPriority.HIGH,
        description: 'Acknowledgment of loan application submission',
    },
    {
        event: NotificationEvent.MEMBER_LOAN_DECISION,
        targetRole: UserRole.MEMBER,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: '{{decision}}: Loan #{{loanId}} {{status}}. {{message}}',
        emailSubject: 'Loan Application {{status}} - #{{loanId}}',
        emailTemplate: `
            <h2>Loan Application {{status}}</h2>
            <p>Dear {{memberName}},</p>
            <p>{{message}}</p>
            <ul>
                <li><strong>Loan ID:</strong> {{loanId}}</li>
                <li><strong>Amount:</strong> P{{amount}}</li>
                <li><strong>Status:</strong> {{status}}</li>
                {{disbursementDate}}
                {{rejectionReason}}
            </ul>
            <p><a href="{{portalLink}}" class="button">View Details</a></p>
        `,
        placeholders: ['decision', 'loanId', 'status', 'message', 'memberName', 'amount', 'disbursementDate', 'rejectionReason', 'portalLink'],
        priority: NotificationPriority.HIGH,
        description: 'Loan approval or rejection notification',
    },
    {
        event: NotificationEvent.MEMBER_GUARANTOR_REQUEST,
        targetRole: UserRole.MEMBER,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Member {{applicantName}} requests you to guarantee Loan #{{loanId}}.',
        emailSubject: 'Guarantor Request - Loan #{{loanId}}',
        emailTemplate: `
            <h2>Guarantor Request</h2>
            <p>Dear {{memberName}},</p>
            <p>Member <strong>{{applicantName}}</strong> has requested you to act as a guarantor for their loan application.</p>
            <ul>
                <li><strong>Loan ID:</strong> {{loanId}}</li>
                <li><strong>Amount:</strong> P{{amount}}</li>
                <li><strong>Purpose:</strong> {{purpose}}</li>
            </ul>
            <p><a href="{{approvalLink}}" class="button">Review Request</a></p>
            <p><em>Please review carefully before accepting this responsibility.</em></p>
        `,
        placeholders: ['memberName', 'applicantName', 'loanId', 'amount', 'purpose', 'approvalLink'],
        priority: NotificationPriority.HIGH,
        description: 'Request to act as loan guarantor',
    },
    {
        event: NotificationEvent.MEMBER_CLAIM_STATUS,
        targetRole: UserRole.MEMBER,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: '{{claimType}} Claim #{{claimId}} status changed to: {{status}}.',
        emailSubject: 'Claim Status Update - #{{claimId}}',
        emailTemplate: `
            <h2>Claim Status Update</h2>
            <p>Dear {{memberName}},</p>
            <p>Your {{claimType}} claim status has been updated:</p>
            <ul>
                <li><strong>Claim ID:</strong> {{claimId}}</li>
                <li><strong>Type:</strong> {{claimType}}</li>
                <li><strong>Status:</strong> {{status}}</li>
                <li><strong>Amount:</strong> P{{amount}}</li>
                {{statusMessage}}
            </ul>
            <p><a href="{{claimLink}}" class="button">View Claim Details</a></p>
        `,
        placeholders: ['memberName', 'claimType', 'claimId', 'status', 'amount', 'statusMessage', 'claimLink'],
        priority: NotificationPriority.HIGH,
        description: 'Insurance claim status update',
    },
    {
        event: NotificationEvent.MEMBER_MISSED_PAYMENT,
        targetRole: UserRole.MEMBER,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Urgent: Loan repayment of P{{amount}} failed. Please contact office.',
        emailSubject: 'Urgent: Missed Loan Payment',
        emailTemplate: `
            <h2 style="color: #d32f2f;">Missed Payment Alert</h2>
            <p>Dear {{memberName}},</p>
            <p>We were unable to process your loan repayment:</p>
            <ul>
                <li><strong>Loan ID:</strong> {{loanId}}</li>
                <li><strong>Amount Due:</strong> P{{amount}}</li>
                <li><strong>Due Date:</strong> {{dueDate}}</li>
                <li><strong>Reason:</strong> {{reason}}</li>
            </ul>
            <p><strong>Action Required:</strong> Please contact our office or make a manual payment to avoid penalties.</p>
            <p><a href="{{paymentLink}}" class="button">Make Payment</a></p>
        `,
        placeholders: ['memberName', 'amount', 'loanId', 'dueDate', 'reason', 'paymentLink'],
        priority: NotificationPriority.URGENT,
        description: 'Alert for failed loan repayment',
    },

    // ========================================
    // TENANT TIER - SACCOS ADMIN (3 events)
    // ========================================
    {
        event: NotificationEvent.SACCOS_SYSTEM_ALERT,
        targetRole: UserRole.SACCOS_ADMIN,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'SYSTEM ALERT: {{alertMessage}}',
        emailSubject: 'System Alert - {{alertType}}',
        emailTemplate: `
            <h2 style="color: #f57c00;">System Alert</h2>
            <p><strong>Alert Type:</strong> {{alertType}}</p>
            <p><strong>Message:</strong> {{alertMessage}}</p>
            <p><strong>Action Required:</strong> {{actionRequired}}</p>
            <p><strong>Time:</strong> {{timestamp}}</p>
            <p><a href="{{dashboardLink}}" class="button">View Dashboard</a></p>
        `,
        placeholders: ['alertMessage', 'alertType', 'actionRequired', 'timestamp', 'dashboardLink'],
        priority: NotificationPriority.URGENT,
        description: 'Critical system alerts for SACCOS admins',
    },
    {
        event: NotificationEvent.SACCOS_STAFF_CREATED,
        targetRole: UserRole.SACCOS_ADMIN,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'New Staff User Created - {{userName}}',
        emailTemplate: `
            <h2>New Staff User Created</h2>
            <p>A new staff member has been added to your SACCOS:</p>
            <ul>
                <li><strong>Name:</strong> {{userName}}</li>
                <li><strong>Email:</strong> {{userEmail}}</li>
                <li><strong>Role:</strong> {{userRole}}</li>
                <li><strong>Created By:</strong> {{createdBy}}</li>
                <li><strong>Date:</strong> {{createdDate}}</li>
            </ul>
            <p>Please send them their welcome email and login credentials.</p>
        `,
        placeholders: ['userName', 'userEmail', 'userRole', 'createdBy', 'createdDate'],
        priority: NotificationPriority.MEDIUM,
        description: 'Notification when new staff user is created',
    },
    {
        event: NotificationEvent.SACCOS_LICENSE_EXPIRY,
        targetRole: UserRole.SACCOS_ADMIN,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Warning: Society Registration expires in {{daysRemaining}} days.',
        emailSubject: 'License Expiry Warning - {{daysRemaining}} Days Remaining',
        emailTemplate: `
            <h2 style="color: #f57c00;">License Expiry Warning</h2>
            <p>Your Society Registration is expiring soon:</p>
            <ul>
                <li><strong>Society Name:</strong> {{societyName}}</li>
                <li><strong>License Number:</strong> {{licenseNumber}}</li>
                <li><strong>Expiry Date:</strong> {{expiryDate}}</li>
                <li><strong>Days Remaining:</strong> {{daysRemaining}}</li>
            </ul>
            <p><strong>Action Required:</strong> Please renew your registration to avoid service interruption.</p>
            <p><a href="{{renewalLink}}" class="button">Renew License</a></p>
        `,
        placeholders: ['daysRemaining', 'societyName', 'licenseNumber', 'expiryDate', 'renewalLink'],
        priority: NotificationPriority.HIGH,
        description: 'Warning for upcoming license expiry',
    },

    // ========================================
    // TENANT TIER - LOAN OFFICER (2 events)
    // ========================================
    {
        event: NotificationEvent.LOAN_OFFICER_NEW_APPLICATION,
        targetRole: UserRole.LOAN_OFFICER,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'New Loan Application - #{{loanId}}',
        emailTemplate: `
            <h2>New Loan Application Pending Review</h2>
            <p>A new loan application has been submitted:</p>
            <ul>
                <li><strong>Application ID:</strong> {{loanId}}</li>
                <li><strong>Applicant:</strong> {{applicantName}}</li>
                <li><strong>Amount:</strong> P{{amount}}</li>
                <li><strong>Purpose:</strong> {{purpose}}</li>
                <li><strong>Submitted:</strong> {{submittedDate}}</li>
            </ul>
            <p><a href="{{reviewLink}}" class="button">Review Application</a></p>
        `,
        placeholders: ['loanId', 'applicantName', 'amount', 'purpose', 'submittedDate', 'reviewLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'New loan application notification for loan officers',
    },
    {
        event: NotificationEvent.LOAN_OFFICER_DOCUMENT_MISSING,
        targetRole: UserRole.LOAN_OFFICER,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Document Issue - Loan #{{loanId}}',
        emailTemplate: `
            <h2>Document Verification Issue</h2>
            <p>There is an issue with documents for loan application:</p>
            <ul>
                <li><strong>Loan ID:</strong> {{loanId}}</li>
                <li><strong>Applicant:</strong> {{applicantName}}</li>
                <li><strong>Issue:</strong> {{issueDescription}}</li>
                <li><strong>Missing/Invalid:</strong> {{documentType}}</li>
            </ul>
            <p><a href="{{reviewLink}}" class="button">Review Documents</a></p>
        `,
        placeholders: ['loanId', 'applicantName', 'issueDescription', 'documentType', 'reviewLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'Alert for missing or invalid loan documents',
    },

    // ========================================
    // TENANT TIER - ACCOUNTANT (3 events)
    // ========================================
    {
        event: NotificationEvent.ACCOUNTANT_SUSPENSE_ALERT,
        targetRole: UserRole.ACCOUNTANT,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'MoF Return File processed. {{suspenseCount}} records moved to Suspense.',
        emailSubject: 'Suspense Account Alert - {{suspenseCount}} Records',
        emailTemplate: `
            <h2>Suspense Account Alert</h2>
            <p>The MoF Return File has been processed with unmatched records:</p>
            <ul>
                <li><strong>File:</strong> {{fileName}}</li>
                <li><strong>Suspense Records:</strong> {{suspenseCount}}</li>
                <li><strong>Total Amount:</strong> P{{totalAmount}}</li>
                <li><strong>Processed Date:</strong> {{processedDate}}</li>
            </ul>
            <p><a href="{{suspenseLink}}" class="button">Review Suspense Records</a></p>
        `,
        placeholders: ['suspenseCount', 'fileName', 'totalAmount', 'processedDate', 'suspenseLink'],
        priority: NotificationPriority.HIGH,
        description: 'Alert for suspense account entries',
    },
    {
        event: NotificationEvent.ACCOUNTANT_BANK_SYNC_FAIL,
        targetRole: UserRole.ACCOUNTANT,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Critical: Bank API connection failed. Re-auth required.',
        emailSubject: 'Critical: Bank Sync Failure',
        emailTemplate: `
            <h2 style="color: #d32f2f;">Bank Synchronization Failed</h2>
            <p><strong>Critical Issue:</strong> Bank API connection has failed.</p>
            <ul>
                <li><strong>Bank:</strong> {{bankName}}</li>
                <li><strong>Error:</strong> {{errorMessage}}</li>
                <li><strong>Last Successful Sync:</strong> {{lastSyncDate}}</li>
            </ul>
            <p><strong>Action Required:</strong> Re-authenticate bank connection immediately.</p>
            <p><a href="{{reconnectLink}}" class="button">Reconnect Bank</a></p>
        `,
        placeholders: ['bankName', 'errorMessage', 'lastSyncDate', 'reconnectLink'],
        priority: NotificationPriority.URGENT,
        description: 'Critical alert for bank sync failures',
    },
    {
        event: NotificationEvent.ACCOUNTANT_PAYROLL_MISMATCH,
        targetRole: UserRole.ACCOUNTANT,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Payroll Variance Report - {{month}}',
        emailTemplate: `
            <h2>Payroll Variance Detected</h2>
            <p>A variance has been detected in payroll processing:</p>
            <ul>
                <li><strong>Month:</strong> {{month}}</li>
                <li><strong>Expected Amount:</strong> P{{expectedAmount}}</li>
                <li><strong>Received Amount:</strong> P{{receivedAmount}}</li>
                <li><strong>Variance:</strong> P{{variance}}</li>
                <li><strong>Affected Members:</strong> {{affectedCount}}</li>
            </ul>
            <p><a href="{{reportLink}}" class="button">View Full Report</a></p>
        `,
        placeholders: ['month', 'expectedAmount', 'receivedAmount', 'variance', 'affectedCount', 'reportLink'],
        priority: NotificationPriority.HIGH,
        description: 'Payroll variance notification',
    },

    // ========================================
    // TENANT TIER - MEMBER SERVICE REP (2 events)
    // ========================================
    {
        event: NotificationEvent.MEMBER_SERVICE_NEW_MEMBER,
        targetRole: UserRole.MEMBER_SERVICE_REP,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'New Member Registration - {{memberName}}',
        emailTemplate: `
            <h2>New Member Registration</h2>
            <p>A new member registration is pending KYC verification:</p>
            <ul>
                <li><strong>Member ID:</strong> {{memberId}}</li>
                <li><strong>Name:</strong> {{memberName}}</li>
                <li><strong>Email:</strong> {{memberEmail}}</li>
                <li><strong>Phone:</strong> {{memberPhone}}</li>
                <li><strong>Registration Date:</strong> {{registrationDate}}</li>
            </ul>
            <p><a href="{{verificationLink}}" class="button">Verify KYC</a></p>
        `,
        placeholders: ['memberId', 'memberName', 'memberEmail', 'memberPhone', 'registrationDate', 'verificationLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'New member registration notification',
    },
    {
        event: NotificationEvent.MEMBER_SERVICE_TICKET_ASSIGNED,
        targetRole: UserRole.MEMBER_SERVICE_REP,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Support Ticket Assigned - #{{ticketId}}',
        emailTemplate: `
            <h2>Support Ticket Assigned</h2>
            <p>A support ticket has been assigned to you:</p>
            <ul>
                <li><strong>Ticket ID:</strong> {{ticketId}}</li>
                <li><strong>Member:</strong> {{memberName}}</li>
                <li><strong>Subject:</strong> {{subject}}</li>
                <li><strong>Priority:</strong> {{priority}}</li>
                <li><strong>Created:</strong> {{createdDate}}</li>
            </ul>
            <p><a href="{{ticketLink}}" class="button">View Ticket</a></p>
        `,
        placeholders: ['ticketId', 'memberName', 'subject', 'priority', 'createdDate', 'ticketLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'Support ticket assignment notification',
    },

    // ========================================
    // TENANT TIER - CREDIT COMMITTEE (2 events)
    // ========================================
    {
        event: NotificationEvent.CREDIT_COMMITTEE_APPROVAL_REQUEST,
        targetRole: UserRole.CREDIT_COMMITTEE,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Action Required: Loan #{{loanId}} (P{{amount}}) awaits your vote.',
        emailSubject: 'Loan Approval Request - #{{loanId}}',
        emailTemplate: `
            <h2>Loan Approval Request</h2>
            <p>Dear Committee Member,</p>
            <p>A new loan application requires your review and vote:</p>
            <ul>
                <li><strong>Loan ID:</strong> {{loanId}}</li>
                <li><strong>Applicant:</strong> {{applicantName}}</li>
                <li><strong>Amount:</strong> P{{amount}}</li>
                <li><strong>Purpose:</strong> {{purpose}}</li>
                <li><strong>Credit Score:</strong> {{creditScore}}</li>
                <li><strong>Recommendation:</strong> {{recommendation}}</li>
            </ul>
            <p><a href="{{approvalLink}}" class="button">Review & Vote</a></p>
        `,
        placeholders: ['loanId', 'applicantName', 'amount', 'purpose', 'creditScore', 'recommendation', 'approvalLink'],
        priority: NotificationPriority.HIGH,
        description: 'Loan approval request for credit committee',
    },
    {
        event: NotificationEvent.CREDIT_COMMITTEE_MEETING_REMINDER,
        targetRole: UserRole.CREDIT_COMMITTEE,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Credit Committee meeting scheduled for {{meetingDate}} at {{meetingTime}}.',
        emailSubject: 'Credit Committee Meeting - {{meetingDate}}',
        emailTemplate: `
            <h2>Credit Committee Meeting Reminder</h2>
            <p>Dear Committee Member,</p>
            <p>This is a reminder of the upcoming Credit Committee meeting:</p>
            <ul>
                <li><strong>Date:</strong> {{meetingDate}}</li>
                <li><strong>Time:</strong> {{meetingTime}}</li>
                <li><strong>Location:</strong> {{location}}</li>
                <li><strong>Agenda Items:</strong> {{agendaCount}}</li>
            </ul>
            <p><a href="{{agendaLink}}" class="button">View Agenda</a></p>
        `,
        placeholders: ['meetingDate', 'meetingTime', 'location', 'agendaCount', 'agendaLink'],
        priority: NotificationPriority.HIGH,
        description: 'Credit committee meeting reminder',
    },

    // ========================================
    // DCD TIER - Department of Co-operative Development (3 events)
    // ========================================
    {
        event: NotificationEvent.DCD_DIRECTOR_CRITICAL_FAILURE,
        targetRole: UserRole.DCD_DIRECTOR,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'CRITICAL: {{alertMessage}}',
        emailSubject: 'CRITICAL System Alert - {{region}}',
        emailTemplate: `
            <h2 style="color: #d32f2f;">Critical System Failure</h2>
            <p><strong>Alert:</strong> {{alertMessage}}</p>
            <ul>
                <li><strong>Region:</strong> {{region}}</li>
                <li><strong>Affected Systems:</strong> {{affectedSystems}}</li>
                <li><strong>Impact:</strong> {{impact}}</li>
                <li><strong>Detected:</strong> {{timestamp}}</li>
            </ul>
            <p><strong>Immediate Action Required</strong></p>
            <p><a href="{{dashboardLink}}" class="button">View System Dashboard</a></p>
        `,
        placeholders: ['alertMessage', 'region', 'affectedSystems', 'impact', 'timestamp', 'dashboardLink'],
        priority: NotificationPriority.URGENT,
        description: 'Critical system failure alert for DCD',
    },
    {
        event: NotificationEvent.DCD_DIRECTOR_FRAUD_ALERT,
        targetRole: UserRole.DCD_DIRECTOR,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'FRAUD ALERT: {{alertMessage}} in Society {{societyName}}',
        emailSubject: 'URGENT: Fraud Alert - {{societyName}}',
        emailTemplate: `
            <h2 style="color: #d32f2f;">Fraud Alert</h2>
            <p><strong>Suspicious Activity Detected</strong></p>
            <ul>
                <li><strong>Society:</strong> {{societyName}}</li>
                <li><strong>Alert:</strong> {{alertMessage}}</li>
                <li><strong>Details:</strong> {{details}}</li>
                <li><strong>Risk Level:</strong> {{riskLevel}}</li>
                <li><strong>Detected:</strong> {{timestamp}}</li>
            </ul>
            <p><a href="{{investigationLink}}" class="button">View Investigation</a></p>
        `,
        placeholders: ['alertMessage', 'societyName', 'details', 'riskLevel', 'timestamp', 'investigationLink'],
        priority: NotificationPriority.URGENT,
        description: 'Fraud detection alert for DCD',
    },
    {
        event: NotificationEvent.DCD_COMPLIANCE_NON_COMPLIANCE,
        targetRole: UserRole.DCD_COMPLIANCE_OFFICER,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Cooperative Compliance Alert - {{issueType}}',
        emailTemplate: `
            <h2>Cooperative Compliance Alert</h2>
            <p>Non-compliance with cooperative principles detected:</p>
            <ul>
                <li><strong>Issue Type:</strong> {{issueType}}</li>
                <li><strong>Affected Societies:</strong> {{societyCount}}</li>
                <li><strong>Details:</strong> {{details}}</li>
                <li><strong>Deadline:</strong> {{deadline}}</li>
            </ul>
            <p><a href="{{reportLink}}" class="button">View Full Report</a></p>
        `,
        placeholders: ['issueType', 'societyCount', 'details', 'deadline', 'reportLink'],
        priority: NotificationPriority.HIGH,
        description: 'Cooperative compliance alert for DCD',
    },

    // ========================================
    // BOB TIER - Bank of Botswana (3 events)
    // ========================================
    {
        event: NotificationEvent.BOB_SUPERVISOR_LIQUIDITY_ALERT,
        targetRole: UserRole.BOB_PRUDENTIAL_SUPERVISOR,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'LIQUIDITY ALERT: {{societyName}} - {{alertMessage}}',
        emailSubject: 'Liquidity Alert - {{societyName}}',
        emailTemplate: `
            <h2 style="color: #f57c00;">Liquidity Alert</h2>
            <p><strong>Prudential Supervision Alert</strong></p>
            <ul>
                <li><strong>Society:</strong> {{societyName}}</li>
                <li><strong>Alert:</strong> {{alertMessage}}</li>
                <li><strong>Current Ratio:</strong> {{liquidityRatio}}</li>
                <li><strong>Threshold:</strong> {{threshold}}</li>
                <li><strong>Detected:</strong> {{timestamp}}</li>
            </ul>
            <p><a href="{{reportLink}}" class="button">View Financial Report</a></p>
        `,
        placeholders: ['societyName', 'alertMessage', 'liquidityRatio', 'threshold', 'timestamp', 'reportLink'],
        priority: NotificationPriority.URGENT,
        description: 'Liquidity alert for BoB prudential supervision',
    },
    {
        event: NotificationEvent.BOB_AUDITOR_AUDIT_ASSIGNED,
        targetRole: UserRole.BOB_FINANCIAL_AUDITOR,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Financial audit assigned: Society {{societyName}} on {{auditDate}}',
        emailSubject: 'Financial Audit Assignment - {{societyName}}',
        emailTemplate: `
            <h2>Financial Audit Assignment</h2>
            <p>You have been assigned to conduct a financial audit:</p>
            <ul>
                <li><strong>Society:</strong> {{societyName}}</li>
                <li><strong>Audit Date:</strong> {{auditDate}}</li>
                <li><strong>Focus Areas:</strong> {{focusAreas}}</li>
                <li><strong>Location:</strong> {{location}}</li>
                <li><strong>Contact Person:</strong> {{contactPerson}}</li>
            </ul>
            <p><a href="{{auditLink}}" class="button">View Audit Details</a></p>
        `,
        placeholders: ['societyName', 'auditDate', 'focusAreas', 'location', 'contactPerson', 'auditLink'],
        priority: NotificationPriority.HIGH,
        description: 'Financial audit assignment for BoB',
    },
    {
        event: NotificationEvent.BOB_COMPLIANCE_CAPITAL_BREACH,
        targetRole: UserRole.BOB_COMPLIANCE_OFFICER,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'CAPITAL BREACH: {{societyName}} - {{alertMessage}}',
        emailSubject: 'Capital Adequacy Breach - {{societyName}}',
        emailTemplate: `
            <h2 style="color: #d32f2f;">Capital Adequacy Breach</h2>
            <p><strong>Regulatory Breach Detected</strong></p>
            <ul>
                <li><strong>Society:</strong> {{societyName}}</li>
                <li><strong>Alert:</strong> {{alertMessage}}</li>
                <li><strong>Current CAR:</strong> {{currentCAR}}</li>
                <li><strong>Required CAR:</strong> {{requiredCAR}}</li>
                <li><strong>Severity:</strong> {{severity}}</li>
                <li><strong>Detected:</strong> {{timestamp}}</li>
            </ul>
            <p><strong>Immediate Investigation Required</strong></p>
            <p><a href="{{reportLink}}" class="button">View Compliance Report</a></p>
        `,
        placeholders: ['societyName', 'alertMessage', 'currentCAR', 'requiredCAR', 'severity', 'timestamp', 'reportLink'],
        priority: NotificationPriority.URGENT,
        description: 'Capital adequacy breach alert for BoB',
    },

    // ========================================
    // GOVERNMENT OFFICERS (6 events)
    // ========================================
    {
        event: NotificationEvent.REGISTRY_CLERK_NEW_APPLICATION,
        targetRole: UserRole.REGISTRY_CLERK,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'New Society Application - {{societyName}}',
        emailTemplate: `
            <h2>New Society Application</h2>
            <p>A new society application has been received:</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Society Name:</strong> {{societyName}}</li>
                <li><strong>Applicant:</strong> {{applicantName}}</li>
                <li><strong>Submitted:</strong> {{submittedDate}}</li>
            </ul>
            <p>Please verify all submitted documents.</p>
            <p><a href="{{reviewLink}}" class="button">Review Application</a></p>
        `,
        placeholders: ['applicationId', 'societyName', 'applicantName', 'submittedDate', 'reviewLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'New society application notification',
    },
    {
        event: NotificationEvent.INTELLIGENCE_LIAISON_VETTING_REQUEST,
        targetRole: UserRole.INTELLIGENCE_LIAISON,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Background Check Request - App #{{applicationId}}',
        emailTemplate: `
            <h2>Background Check Required</h2>
            <p>Background vetting is required for a society application:</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Society Name:</strong> {{societyName}}</li>
                <li><strong>Individuals to Vet:</strong> {{individualCount}}</li>
            </ul>
            <p><a href="{{vettingLink}}" class="button">View Vetting Request</a></p>
        `,
        placeholders: ['applicationId', 'societyName', 'individualCount', 'vettingLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'Background vetting request',
    },
    {
        event: NotificationEvent.LEGAL_OFFICER_REVIEW_REQUEST,
        targetRole: UserRole.LEGAL_OFFICER,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Legal Review Required - {{societyName}}',
        emailTemplate: `
            <h2>Legal Review Request</h2>
            <p>Constitution and legal documents require your review:</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Society Name:</strong> {{societyName}}</li>
                <li><strong>Document Type:</strong> {{documentType}}</li>
            </ul>
            <p><a href="{{reviewLink}}" class="button">Review Documents</a></p>
        `,
        placeholders: ['applicationId', 'societyName', 'documentType', 'reviewLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'Legal review request',
    },
    {
        event: NotificationEvent.REGISTRAR_FINAL_DECISION,
        targetRole: UserRole.REGISTRAR,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Application #{{applicationId}} recommended for {{decision}}. Please sign.',
        emailSubject: 'Final Decision Required - App #{{applicationId}}',
        emailTemplate: `
            <h2>Final Decision Required</h2>
            <p>An application is ready for your final decision:</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Society Name:</strong> {{societyName}}</li>
                <li><strong>Recommendation:</strong> {{decision}}</li>
                <li><strong>Submitted:</strong> {{submissionDate}}</li>
            </ul>
            <p><a href="{{reviewLink}}" class="button">Review & Sign</a></p>
        `,
        placeholders: ['applicationId', 'societyName', 'decision', 'submissionDate', 'reviewLink'],
        priority: NotificationPriority.HIGH,
        description: 'Final decision request for registrar',
    },
    {
        event: NotificationEvent.DIRECTOR_COOPERATIVES_VIABILITY_REVIEW,
        targetRole: UserRole.DIRECTOR_COOPERATIVES,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Viability Assessment Required - {{cooperativeName}}',
        emailTemplate: `
            <h2>Economic Viability Review</h2>
            <p>A cooperative viability report requires your assessment:</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Cooperative Name:</strong> {{cooperativeName}}</li>
                <li><strong>Business Type:</strong> {{businessType}}</li>
                <li><strong>Projected Revenue:</strong> P{{projectedRevenue}}</li>
            </ul>
            <p><a href="{{reviewLink}}" class="button">Review Viability Report</a></p>
        `,
        placeholders: ['applicationId', 'cooperativeName', 'businessType', 'projectedRevenue', 'reviewLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'Cooperative viability review request',
    },
    {
        event: NotificationEvent.MINISTER_DELEGATE_APPEAL_LODGED,
        targetRole: UserRole.MINISTER_DELEGATE,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Appeal Lodged - App #{{applicationId}}',
        emailTemplate: `
            <h2>Appeal Notification</h2>
            <p>An appeal has been lodged against a registration decision:</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Society Name:</strong> {{societyName}}</li>
                <li><strong>Original Decision:</strong> {{originalDecision}}</li>
                <li><strong>Appeal Grounds:</strong> {{appealGrounds}}</li>
                <li><strong>Lodged:</strong> {{appealDate}}</li>
            </ul>
            <p><a href="{{appealLink}}" class="button">Review Appeal</a></p>
        `,
        placeholders: ['applicationId', 'societyName', 'originalDecision', 'appealGrounds', 'appealDate', 'appealLink'],
        priority: NotificationPriority.HIGH,
        description: 'Appeal lodged notification',
    },

    // ========================================
    // APPLICANTS (5 events)
    // ========================================
    {
        event: NotificationEvent.SOCIETY_APPLICANT_APP_RECEIVED,
        targetRole: UserRole.SOCIETY_APPLICANT,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Application received. Ref #{{applicationId}}. Track status online.',
        emailSubject: 'Application Received - Ref #{{applicationId}}',
        emailTemplate: `
            <h2>Application Received</h2>
            <p>Dear {{applicantName}},</p>
            <p>We have received your society registration application:</p>
            <ul>
                <li><strong>Reference Number:</strong> {{applicationId}}</li>
                <li><strong>Society Name:</strong> {{societyName}}</li>
                <li><strong>Submitted:</strong> {{submittedDate}}</li>
            </ul>
            <p>You can track your application status online.</p>
            <p><a href="{{trackingLink}}" class="button">Track Application</a></p>
        `,
        placeholders: ['applicationId', 'applicantName', 'societyName', 'submittedDate', 'trackingLink'],
        priority: NotificationPriority.HIGH,
        description: 'Application receipt confirmation',
    },
    {
        event: NotificationEvent.SOCIETY_APPLICANT_QUERY_RAISED,
        targetRole: UserRole.SOCIETY_APPLICANT,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Action: {{queryMessage}}',
        emailSubject: 'Action Required - App #{{applicationId}}',
        emailTemplate: `
            <h2>Action Required</h2>
            <p>Dear {{applicantName}},</p>
            <p>We need additional information for your application:</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Query:</strong> {{queryMessage}}</li>
                <li><strong>Deadline:</strong> {{deadline}}</li>
            </ul>
            <p><a href="{{responseLink}}" class="button">Respond to Query</a></p>
        `,
        placeholders: ['applicantName', 'applicationId', 'queryMessage', 'deadline', 'responseLink'],
        priority: NotificationPriority.HIGH,
        description: 'Query raised on application',
    },
    {
        event: NotificationEvent.SOCIETY_APPLICANT_OUTCOME,
        targetRole: UserRole.SOCIETY_APPLICANT,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Registration {{status}}! {{message}}',
        emailSubject: 'Society Registration {{status}}',
        emailTemplate: `
            <h2>Registration {{status}}</h2>
            <p>Dear {{applicantName}},</p>
            <p>{{message}}</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Society Name:</strong> {{societyName}}</li>
                <li><strong>Status:</strong> {{status}}</li>
                {{certificateNumber}}
            </ul>
            {{certificateLink}}
        `,
        placeholders: ['status', 'message', 'applicantName', 'applicationId', 'societyName', 'certificateNumber', 'certificateLink'],
        priority: NotificationPriority.HIGH,
        description: 'Final application outcome',
    },
    {
        event: NotificationEvent.COOPERATIVE_APPLICANT_VIABILITY_CHECK,
        targetRole: UserRole.COOPERATIVE_APPLICANT,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Viability Assessment Update - {{cooperativeName}}',
        emailTemplate: `
            <h2>Economic Viability Assessment</h2>
            <p>Dear {{applicantName}},</p>
            <p>Your Economic Viability Report is under review:</p>
            <ul>
                <li><strong>Application ID:</strong> {{applicationId}}</li>
                <li><strong>Cooperative Name:</strong> {{cooperativeName}}</li>
                <li><strong>Status:</strong> {{status}}</li>
            </ul>
            <p>{{statusMessage}}</p>
        `,
        placeholders: ['applicantName', 'applicationId', 'cooperativeName', 'status', 'statusMessage'],
        priority: NotificationPriority.MEDIUM,
        description: 'Viability assessment update',
    },
    {
        event: NotificationEvent.COOPERATIVE_APPLICANT_INSPECTION,
        targetRole: UserRole.COOPERATIVE_APPLICANT,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Officer will visit your premises on {{inspectionDate}} for inspection.',
        emailSubject: 'Premises Inspection Scheduled - {{inspectionDate}}',
        emailTemplate: `
            <h2>Premises Inspection Scheduled</h2>
            <p>Dear {{applicantName}},</p>
            <p>An officer will visit your premises for inspection:</p>
            <ul>
                <li><strong>Date:</strong> {{inspectionDate}}</li>
                <li><strong>Time:</strong> {{inspectionTime}}</li>
                <li><strong>Inspector:</strong> {{inspectorName}}</li>
                <li><strong>Location:</strong> {{location}}</li>
            </ul>
            <p>Please ensure all relevant personnel and documents are available.</p>
        `,
        placeholders: ['applicantName', 'inspectionDate', 'inspectionTime', 'inspectorName', 'location'],
        priority: NotificationPriority.HIGH,
        description: 'Premises inspection notification',
    },

    // ========================================
    // EXTERNAL USERS (4 events)
    // ========================================
    {
        event: NotificationEvent.EXTERNAL_AUDITOR_INVITE,
        targetRole: UserRole.EXTERNAL_AUDITOR,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Audit Invitation - {{societyName}}',
        emailTemplate: `
            <h2>Audit Invitation</h2>
            <p>Dear Auditor,</p>
            <p>You have been invited to audit:</p>
            <ul>
                <li><strong>Society:</strong> {{societyName}}</li>
                <li><strong>Audit Period:</strong> {{auditPeriod}}</li>
                <li><strong>Deadline:</strong> {{deadline}}</li>
                <li><strong>Scope:</strong> {{scope}}</li>
            </ul>
            <p><a href="{{acceptLink}}" class="button">Accept Invitation</a></p>
        `,
        placeholders: ['societyName', 'auditPeriod', 'deadline', 'scope', 'acceptLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'External auditor invitation',
    },
    {
        event: NotificationEvent.EXTERNAL_AUDITOR_REPORT_DUE,
        targetRole: UserRole.EXTERNAL_AUDITOR,
        channels: [NotificationChannel.EMAIL],
        emailSubject: 'Audit Report Due - {{societyName}}',
        emailTemplate: `
            <h2>Audit Report Reminder</h2>
            <p>Dear Auditor,</p>
            <p>This is a reminder that your audit report is due:</p>
            <ul>
                <li><strong>Society:</strong> {{societyName}}</li>
                <li><strong>Audit Period:</strong> {{auditPeriod}}</li>
                <li><strong>Due Date:</strong> {{dueDate}}</li>
                <li><strong>Days Remaining:</strong> {{daysRemaining}}</li>
            </ul>
            <p><a href="{{uploadLink}}" class="button">Upload Report</a></p>
        `,
        placeholders: ['societyName', 'auditPeriod', 'dueDate', 'daysRemaining', 'uploadLink'],
        priority: NotificationPriority.HIGH,
        description: 'Audit report due reminder',
    },
    {
        event: NotificationEvent.VENDOR_PO_RECEIVED,
        targetRole: UserRole.VENDOR,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'New Purchase Order #{{poNumber}} from {{societyName}}.',
        emailSubject: 'New Purchase Order - #{{poNumber}}',
        emailTemplate: `
            <h2>New Purchase Order</h2>
            <p>Dear Vendor,</p>
            <p>You have received a new purchase order:</p>
            <ul>
                <li><strong>PO Number:</strong> {{poNumber}}</li>
                <li><strong>From:</strong> {{societyName}}</li>
                <li><strong>Amount:</strong> P{{amount}}</li>
                <li><strong>Delivery Date:</strong> {{deliveryDate}}</li>
            </ul>
            <p><a href="{{poLink}}" class="button">View Purchase Order</a></p>
        `,
        placeholders: ['poNumber', 'societyName', 'amount', 'deliveryDate', 'poLink'],
        priority: NotificationPriority.MEDIUM,
        description: 'Purchase order notification',
    },
    {
        event: NotificationEvent.VENDOR_PAYMENT_SENT,
        targetRole: UserRole.VENDOR,
        channels: [NotificationChannel.SMS, NotificationChannel.EMAIL],
        smsTemplate: 'Payment of P{{amount}} processed for Invoice #{{invoiceId}}.',
        emailSubject: 'Payment Processed - Invoice #{{invoiceId}}',
        emailTemplate: `
            <h2>Payment Confirmation</h2>
            <p>Dear Vendor,</p>
            <p>Payment has been processed for your invoice:</p>
            <ul>
                <li><strong>Invoice:</strong> {{invoiceId}}</li>
                <li><strong>Amount:</strong> P{{amount}}</li>
                <li><strong>Payment Date:</strong> {{paymentDate}}</li>
                <li><strong>Reference:</strong> {{reference}}</li>
                <li><strong>Method:</strong> {{paymentMethod}}</li>
            </ul>
        `,
        placeholders: ['invoiceId', 'amount', 'paymentDate', 'reference', 'paymentMethod'],
        priority: NotificationPriority.MEDIUM,
        description: 'Payment confirmation to vendor',
    },
];

