import type { SocietyApplication } from './SocietyApplication';
import type { User } from './User';

export enum DocumentType {
    CONSTITUTION = 'constitution',
    FORM_A = 'form_a',
    MEMBERSHIP_LIST = 'membership_list',
    VIABILITY_REPORT = 'viability_report',
    PROOF_OF_CAPITAL = 'proof_of_capital',
    CERTIFICATE = 'certificate',
    REJECTION_NOTICE = 'rejection_notice',
    APPEAL_LETTER = 'appeal_letter',
}
export class ApplicationDocument {
    id?: string;
    applicationId?: string;
    application?: SocietyApplication;
    documentType?: DocumentType;
    fileName?: string;
    fileUrl?: string;
    fileSizeBytes?: number;
    mimeType?: string;
    uploadedBy?: string;
    uploader?: User;
    isVerified?: boolean;
    verifiedAt?: Date;
    verifiedById?: string;
    verifiedBy?: User;
    uploadedAt?: Date;

    get isRequired(): boolean {
        if (this.documentType === DocumentType.CONSTITUTION ||
            this.documentType === DocumentType.FORM_A) {
            return true;
        }
        if (this.application?.applicationType === 'saccos') {
            return this.documentType === DocumentType.VIABILITY_REPORT ||
                this.documentType === DocumentType.PROOF_OF_CAPITAL;
        }
        return false;
    }

    get isGenerated(): boolean {
        return this.documentType === DocumentType.CERTIFICATE ||
            this.documentType === DocumentType.REJECTION_NOTICE;
    }
}
