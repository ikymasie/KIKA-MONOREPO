/**
 * src/interfaces/IKYC.ts
 *
 * Plain TypeScript interface for the `kycs` table row.
 * Used by KYCService and any code that works with raw SQL results.
 */

export interface IKYC {
    id: string;
    memberId: string;

    // Identity documents
    omangNumber?: string;
    omangExpiryDate?: string;
    omangFrontUrl?: string;
    omangBackUrl?: string;
    passportNumber?: string;
    passportExpiryDate?: string;
    passportUrl?: string;

    // Expatriate documents
    workPermitNumber?: string;
    workPermitExpiryDate?: string;
    workPermitUrl?: string;
    residencePermitNumber?: string;
    residencePermitExpiryDate?: string;
    residencePermitUrl?: string;

    // Minor documents
    birthCertificateNumber?: string;
    birthCertificateUrl?: string;
    guardianOmangUrl?: string;

    // Proof of residence
    residenceProofType?: string;
    proofOfResidenceUrl?: string;
    residenceDocumentDate?: string;

    // Source of funds / income
    incomeSourceType?: string;
    proofOfIncomeUrl?: string;
    sourceOfFundsAffidavitUrl?: string;

    // PIP / PEP declaration
    isPip: boolean;
    pipPosition?: string;
    pipDeclarationDate?: string;

    // Identity verification
    identityVerified: boolean;
    identityVerifiedBy?: string;
    identityVerifiedAt?: string;

    // Residence verification
    residenceVerified: boolean;
    residenceVerifiedBy?: string;
    residenceVerifiedAt?: string;

    // Income verification
    incomeVerified: boolean;
    incomeVerifiedBy?: string;
    incomeVerifiedAt?: string;

    // PIP verification
    pipVerified: boolean;
    pipVerifiedBy?: string;
    pipVerifiedAt?: string;

    notes?: string;
    createdAt: string;
    updatedAt: string;
}

/** Whether this KYC record is fully verified (mirrors entity getter). */
export function isKYCFullyVerified(kyc: IKYC): boolean {
    const base = kyc.identityVerified && kyc.residenceVerified && kyc.incomeVerified;
    if (kyc.isPip) return !!(base && kyc.pipVerified);
    return !!base;
}

/** Fields a MEMBER is allowed to set on their own KYC record. */
export const MEMBER_KYC_FIELDS = [
    'omangNumber', 'omangExpiryDate',
    'passportNumber', 'passportExpiryDate',
    'workPermitNumber', 'workPermitExpiryDate',
    'residencePermitNumber', 'residencePermitExpiryDate',
    'birthCertificateNumber',
    'residenceProofType', 'residenceDocumentDate',
    'incomeSourceType',
    'isPip', 'pipPosition', 'pipDeclarationDate',
    'omangFrontUrl', 'omangBackUrl', 'passportUrl',
    'workPermitUrl', 'residencePermitUrl', 'birthCertificateUrl',
    'guardianOmangUrl', 'proofOfResidenceUrl', 'proofOfIncomeUrl',
    'sourceOfFundsAffidavitUrl',
] as const;

/** Fields an ADMIN can additionally set (includes notes and verification timestamps). */
export const ADMIN_KYC_FIELDS = [
    ...MEMBER_KYC_FIELDS,
    'notes',
] as const;

export type IKYCMemberUpdateInput = Partial<Record<typeof MEMBER_KYC_FIELDS[number], unknown>>;
export type IKYCAdminUpdateInput = Partial<Record<typeof ADMIN_KYC_FIELDS[number], unknown>>;

export interface IKYCVerifyInput {
    documentType: 'identity' | 'residence' | 'income' | 'pip';
    verified: boolean;
    verifiedBy: string;
    notes?: string;
}

export interface IKYCStats {
    totalKYCs: number;
    fullyVerified: number;
    pendingIdentity: number;
    pendingResidence: number;
    pendingIncome: number;
    verificationRate: number;
}
