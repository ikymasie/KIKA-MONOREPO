/**
 * src/interfaces/ISocietyApplication.ts
 *
 * Plain TypeScript interfaces for the `society_applications` table and related types.
 */

export enum ApplicationType {
    GENERAL_SOCIETY = 'general_society',
    BURIAL_SOCIETY = 'burial_society',
    RELIGIOUS_SOCIETY = 'religious_society',
    SACCOS = 'saccos',
    COOPERATIVE = 'cooperative',
}

export enum ApplicationStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    INCOMPLETE = 'incomplete',
    UNDER_REVIEW = 'under_review',
    SECURITY_VETTING = 'security_vetting',
    SECURITY_FAILED = 'security_failed',
    LEGAL_REVIEW = 'legal_review',
    LEGAL_REJECTED = 'legal_rejected',
    PENDING_DECISION = 'pending_decision',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    APPEAL_LODGED = 'appeal_lodged',
    APPEAL_APPROVED = 'appeal_approved',
    APPEAL_REJECTED = 'appeal_rejected',
}

export interface ISocietyApplication {
    id: string;
    fileNumber?: string;
    applicationType: ApplicationType;
    proposedName: string;
    status: ApplicationStatus;
    applicantUserId: string;
    primaryContactName: string;
    primaryContactEmail: string;
    primaryContactPhone: string;
    physicalAddress: string;
    submittedAt?: string;
    assignedFileNumberAt?: string;
    securityClearedAt?: string;
    legalApprovedAt?: string;
    finalDecisionAt?: string;
    securityVettingNotes?: string;
    registryClerkId?: string;
    intelligenceLiaisonId?: string;
    legalOfficerId?: string;
    finalDecisionMakerId?: string;
    certificateNumber?: string;
    certificateIssuedAt?: string;
    rejectionReasons?: string;
    appealLodgedAt?: string;
    appealDecisionAt?: string;
    appealDecisionMakerId?: string;
    appealOutcome?: string;
    feeAmount: number;
    feePaidAt?: string;
    createdAt: string;
    updatedAt: string;
}

/** Computed helpers (pure functions, no class). */
export function isApplicationApproved(app: ISocietyApplication): boolean {
    return app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.APPEAL_APPROVED;
}

export function isApplicationRejected(app: ISocietyApplication): boolean {
    return [
        ApplicationStatus.REJECTED,
        ApplicationStatus.SECURITY_FAILED,
        ApplicationStatus.LEGAL_REJECTED,
        ApplicationStatus.APPEAL_REJECTED,
    ].includes(app.status);
}

export function canApplicationAppeal(app: ISocietyApplication): boolean {
    if (!isApplicationRejected(app) || app.status === ApplicationStatus.APPEAL_REJECTED) return false;
    if (!app.finalDecisionAt) return false;
    const daysSince = Math.floor((Date.now() - new Date(app.finalDecisionAt).getTime()) / 86_400_000);
    return daysSince <= 21;
}

/** Statuses that registry clerks work with. */
export const REGISTRY_ACTIVE_STATUSES: ApplicationStatus[] = [
    ApplicationStatus.SUBMITTED,
    ApplicationStatus.INCOMPLETE,
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.SECURITY_VETTING,
    ApplicationStatus.LEGAL_REVIEW,
    ApplicationStatus.PENDING_DECISION,
];

export interface ISocietyApplicationCreateInput {
    applicantUserId: string;
    applicationType: ApplicationType;
    proposedName: string;
    primaryContactName: string;
    primaryContactEmail: string;
    primaryContactPhone: string;
    physicalAddress: string;
    feeAmount?: number;
}

export interface ISocietyApplicationFilters {
    status?: ApplicationStatus;
    applicationType?: ApplicationType;
    search?: string;
}
