/**
 * src/interfaces/IUser.ts
 *
 * Plain TypeScript interface for the `users` table row.
 * Used by UserService and any code that works with raw SQL results.
 */

export enum UserRole {
    SUPER_REGULATOR = 'super_regulator',
    DCD_DIRECTOR = 'dcd_director',
    DCD_FIELD_OFFICER = 'dcd_field_officer',
    DCD_COMPLIANCE_OFFICER = 'dcd_compliance_officer',
    BOB_PRUDENTIAL_SUPERVISOR = 'bob_prudential_supervisor',
    BOB_FINANCIAL_AUDITOR = 'bob_financial_auditor',
    BOB_COMPLIANCE_OFFICER = 'bob_compliance_officer',
    DEDUCTION_OFFICER = 'deduction_officer',
    REGISTRY_CLERK = 'registry_clerk',
    INTELLIGENCE_LIAISON = 'intelligence_liaison',
    LEGAL_OFFICER = 'legal_officer',
    REGISTRAR = 'registrar',
    DIRECTOR_COOPERATIVES = 'director_cooperatives',
    MINISTER_DELEGATE = 'minister_delegate',
    SACCOS_ADMIN = 'saccos_admin',
    LOAN_OFFICER = 'loan_officer',
    ACCOUNTANT = 'accountant',
    MEMBER_SERVICE_REP = 'member_service_rep',
    CREDIT_COMMITTEE = 'credit_committee',
    MEMBER = 'member',
    SOCIETY_APPLICANT = 'society_applicant',
    COOPERATIVE_APPLICANT = 'cooperative_applicant',
    EXTERNAL_AUDITOR = 'external_auditor',
    VENDOR = 'vendor',
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
}

export interface IUser {
    id: string;
    email: string;
    firebaseUid?: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    phone?: string;
    mfaEnabled: boolean;
    mfaSecret?: string;
    tenantId?: string;
    lastLoginAt?: string;
    permissions?: Record<string, boolean>;
    notificationPreferences?: Record<string, unknown>;
    temporaryPassword?: string;
    mustChangePassword: boolean;
    passwordChangedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IUserCreateInput {
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId?: string;
    phone?: string;
    status?: UserStatus;
    mfaEnabled?: boolean;
    permissions?: Record<string, boolean>;
    notificationPreferences?: Record<string, unknown>;
    mustChangePassword?: boolean;
    temporaryPassword?: string;
}

export type IUserUpdateInput = Partial<
    Pick<
        IUser,
        | 'firstName'
        | 'lastName'
        | 'phone'
        | 'role'
        | 'status'
        | 'permissions'
        | 'notificationPreferences'
        | 'firebaseUid'
        | 'mfaEnabled'
        | 'mfaSecret'
        | 'mustChangePassword'
        | 'temporaryPassword'
        | 'passwordChangedAt'
        | 'lastLoginAt'
    >
>;

/** Roles that belong to a SACCO (tenant) administration team. */
export const TENANT_ADMIN_ROLES: UserRole[] = [
    UserRole.SACCOS_ADMIN,
    UserRole.LOAN_OFFICER,
    UserRole.ACCOUNTANT,
    UserRole.MEMBER_SERVICE_REP,
    UserRole.CREDIT_COMMITTEE,
];

/** Roles that can be created by a SACCOS_ADMIN for their own tenant. */
export const CREATABLE_STAFF_ROLES: UserRole[] = [
    UserRole.LOAN_OFFICER,
    UserRole.ACCOUNTANT,
    UserRole.MEMBER_SERVICE_REP,
    UserRole.CREDIT_COMMITTEE,
];

/** Returns true if the user's role is a tenant-level admin. */
export function isTenantAdmin(role: UserRole): boolean {
    return TENANT_ADMIN_ROLES.includes(role);
}
