import type { Member } from './Member';
export class KYC {
    id?: string;
    memberId?: string;
    member?: Member;

    // --- Identity Documents ---
    omangNumber?: string;
    omangExpiryDate?: Date;
    omangFrontUrl?: string;
    omangBackUrl?: string;
    passportNumber?: string;
    passportExpiryDate?: Date;
    passportUrl?: string;

    // For Expatriates
    workPermitNumber?: string;
    workPermitExpiryDate?: Date;
    workPermitUrl?: string;
    residencePermitNumber?: string;
    residencePermitExpiryDate?: Date;
    residencePermitUrl?: string;

    // For Minors
    birthCertificateNumber?: string;
    birthCertificateUrl?: string;
    guardianOmangUrl?: string;

    // --- Proof of Residence ---
    residenceProofType?: string;
    proofOfResidenceUrl?: string;
    residenceDocumentDate?: Date;

    // --- Source of Funds / Income ---
    incomeSourceType?: string;
    proofOfIncomeUrl?: string;
    sourceOfFundsAffidavitUrl?: string;

    // --- PIP / PEP Declaration ---
    isPip?: boolean;
    pipPosition?: string;
    pipDeclarationDate?: Date;

    // --- Verification Status & Metadata ---
    identityVerified?: boolean;
    identityVerifiedBy?: string;
    identityVerifiedAt?: Date;
    residenceVerified?: boolean;
    residenceVerifiedBy?: string;
    residenceVerifiedAt?: Date;
    incomeVerified?: boolean;
    incomeVerifiedBy?: string;
    incomeVerifiedAt?: Date;
    pipVerified?: boolean;
    pipVerifiedBy?: string;
    pipVerifiedAt?: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;

    get isFullyVerified(): boolean {
        const base = this.identityVerified && this.residenceVerified && this.incomeVerified;
        if (this.isPip) {
            return !!(base && this.pipVerified);
        }
        return !!base;
    }
}
