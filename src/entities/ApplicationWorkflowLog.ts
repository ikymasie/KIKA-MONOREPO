import type { SocietyApplication } from './SocietyApplication';
import { ApplicationStatus } from './SocietyApplication';
import type { User } from './User';
export class ApplicationWorkflowLog {
    id?: string;
    applicationId?: string;
    application?: SocietyApplication;
    fromStatus?: ApplicationStatus;
    toStatus?: ApplicationStatus;
    performedBy?: string;
    performer?: User;
    notes?: string;
    metadata?: Record<string, any>;
    createdAt?: Date;

    get isApproval(): boolean {
        return this.toStatus === ApplicationStatus.APPROVED ||
            this.toStatus === ApplicationStatus.APPEAL_APPROVED;
    }

    get isRejection(): boolean {
        return this.toStatus === ApplicationStatus.REJECTED ||
            this.toStatus === ApplicationStatus.SECURITY_FAILED ||
            this.toStatus === ApplicationStatus.LEGAL_REJECTED ||
            this.toStatus === ApplicationStatus.APPEAL_REJECTED;
    }

    get actionDescription(): string {
        switch (this.toStatus) {
            case ApplicationStatus.SUBMITTED:
                return 'Application submitted';
            case ApplicationStatus.INCOMPLETE:
                return 'Marked as incomplete';
            case ApplicationStatus.UNDER_REVIEW:
                return 'File number assigned, routed for review';
            case ApplicationStatus.SECURITY_VETTING:
                return 'Routed to security vetting';
            case ApplicationStatus.SECURITY_FAILED:
                return 'Security clearance failed';
            case ApplicationStatus.LEGAL_REVIEW:
                return 'Routed to legal review';
            case ApplicationStatus.LEGAL_REJECTED:
                return 'Legal review rejected';
            case ApplicationStatus.PENDING_DECISION:
                return 'Legal review approved, pending final decision';
            case ApplicationStatus.APPROVED:
                return 'Application approved';
            case ApplicationStatus.REJECTED:
                return 'Application rejected';
            case ApplicationStatus.APPEAL_LODGED:
                return 'Appeal lodged';
            case ApplicationStatus.APPEAL_APPROVED:
                return 'Appeal approved';
            case ApplicationStatus.APPEAL_REJECTED:
                return 'Appeal rejected';
            default:
                return 'Status updated';
        }
    }
}
