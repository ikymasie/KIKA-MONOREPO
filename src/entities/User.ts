import type { Tenant } from './Tenant';

export enum UserRole {
    // Higher-level Regulatory Auth
    SUPER_REGULATOR = 'super_regulator',

    // Department of Co-operative Development (DCD) - Ministry of Trade and Industry
    DCD_DIRECTOR = 'dcd_director',
    DCD_FIELD_OFFICER = 'dcd_field_officer',
    DCD_COMPLIANCE_OFFICER = 'dcd_compliance_officer',

    // Bank of Botswana (BoB) - Central Bank
    BOB_PRUDENTIAL_SUPERVISOR = 'bob_prudential_supervisor',
    BOB_FINANCIAL_AUDITOR = 'bob_financial_auditor',
    BOB_COMPLIANCE_OFFICER = 'bob_compliance_officer',

    // Shared Regulatory Functions
    DEDUCTION_OFFICER = 'deduction_officer',

    // Government Registration Officers (work with DCD)
    REGISTRY_CLERK = 'registry_clerk',
    INTELLIGENCE_LIAISON = 'intelligence_liaison',
    LEGAL_OFFICER = 'legal_officer',
    REGISTRAR = 'registrar',
    DIRECTOR_COOPERATIVES = 'director_cooperatives',
    MINISTER_DELEGATE = 'minister_delegate',

    // Tenant Tier
    SACCOS_ADMIN = 'saccos_admin',
    LOAN_OFFICER = 'loan_officer',
    ACCOUNTANT = 'accountant',
    MEMBER_SERVICE_REP = 'member_service_rep',
    CREDIT_COMMITTEE = 'credit_committee',

    // Member Tier
    MEMBER = 'member',

    // Applicants
    SOCIETY_APPLICANT = 'society_applicant',
    COOPERATIVE_APPLICANT = 'cooperative_applicant',

    // External
    EXTERNAL_AUDITOR = 'external_auditor',
    VENDOR = 'vendor',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}
export class User {
    id?: string;
    email?: string;
    firebaseUid?: string;
    passwordHash?: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    status?: UserStatus;
    phone?: string;
    mfaEnabled?: boolean;
    mfaSecret?: string;
    tenantId?: string;
    tenant?: Tenant;
    lastLoginAt?: Date;
    permissions?: Record<string, boolean>;
    notificationPreferences?: Record<string, any>;

    // Password Management
    temporaryPassword?: string;
    mustChangePassword?: boolean;
    passwordChangedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }

    isRegulator(): boolean {
        return [
            UserRole.SUPER_REGULATOR,
            UserRole.DCD_DIRECTOR,
            UserRole.DCD_FIELD_OFFICER,
            UserRole.DCD_COMPLIANCE_OFFICER,
            UserRole.BOB_PRUDENTIAL_SUPERVISOR,
            UserRole.BOB_FINANCIAL_AUDITOR,
            UserRole.BOB_COMPLIANCE_OFFICER,
            UserRole.DEDUCTION_OFFICER,
        ].includes(this.role!);
    }

    isDCD(): boolean {
        return [
            UserRole.DCD_DIRECTOR,
            UserRole.DCD_FIELD_OFFICER,
            UserRole.DCD_COMPLIANCE_OFFICER,
        ].includes(this.role!);
    }

    isBoB(): boolean {
        return [
            UserRole.BOB_PRUDENTIAL_SUPERVISOR,
            UserRole.BOB_FINANCIAL_AUDITOR,
            UserRole.BOB_COMPLIANCE_OFFICER,
        ].includes(this.role!);
    }

    isGovernmentOfficer(): boolean {
        return [
            UserRole.REGISTRY_CLERK,
            UserRole.INTELLIGENCE_LIAISON,
            UserRole.LEGAL_OFFICER,
            UserRole.REGISTRAR,
            UserRole.DIRECTOR_COOPERATIVES,
            UserRole.MINISTER_DELEGATE,
        ].includes(this.role!);
    }

    isApplicant(): boolean {
        return [
            UserRole.SOCIETY_APPLICANT,
            UserRole.COOPERATIVE_APPLICANT,
        ].includes(this.role!);
    }

    isTenantAdmin(): boolean {
        return [
            UserRole.SACCOS_ADMIN,
            UserRole.LOAN_OFFICER,
            UserRole.ACCOUNTANT,
            UserRole.MEMBER_SERVICE_REP,
            UserRole.CREDIT_COMMITTEE,
        ].includes(this.role!);
    }
}
