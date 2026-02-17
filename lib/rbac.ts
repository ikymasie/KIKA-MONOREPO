import { UserRole } from '@/src/entities/User';

export interface Permission {
    resource: string;
    actions: ('create' | 'read' | 'update' | 'delete' | 'approve')[];
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_REGULATOR]: [
        { resource: 'tenants', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'applications', actions: ['read', 'approve'] },
        { resource: 'certificates', actions: ['create', 'read'] },
        { resource: 'bylaws', actions: ['read', 'approve'] },
        { resource: 'cooperative_compliance', actions: ['read', 'update'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'audit_logs', actions: ['read'] },
        { resource: 'system_settings', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'platform_analytics', actions: ['read'] },
        { resource: 'deductions', actions: ['read', 'update', 'approve'] },
        { resource: 'reconciliations', actions: ['create', 'read', 'update'] },
        { resource: 'financial_stability', actions: ['read', 'update'] },
        { resource: 'liquidity_reports', actions: ['read'] },
        { resource: 'capital_adequacy', actions: ['read', 'update'] },
        { resource: 'accounts', actions: ['read'] },
        { resource: 'transactions', actions: ['read'] },
    ],

    // Department of Co-operative Development (DCD) - Ministry of Trade and Industry
    // Focus: Registration, bye-laws, cooperative principles, democratic member control
    [UserRole.DCD_DIRECTOR]: [
        { resource: 'tenants', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'applications', actions: ['read', 'approve'] },
        { resource: 'certificates', actions: ['create', 'read'] },
        { resource: 'bylaws', actions: ['read', 'approve'] },
        { resource: 'cooperative_compliance', actions: ['read', 'update'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'audit_logs', actions: ['read'] },
    ],

    [UserRole.DCD_FIELD_OFFICER]: [
        { resource: 'tenants', actions: ['read'] },
        { resource: 'members', actions: ['read'] },
        { resource: 'bylaws', actions: ['read'] },
        { resource: 'cooperative_compliance', actions: ['read', 'update'] },
        { resource: 'reports', actions: ['read'] },
    ],

    [UserRole.DCD_COMPLIANCE_OFFICER]: [
        { resource: 'tenants', actions: ['read'] },
        { resource: 'applications', actions: ['read'] },
        { resource: 'bylaws', actions: ['read'] },
        { resource: 'cooperative_compliance', actions: ['read', 'update'] },
        { resource: 'kyc', actions: ['read'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'audit_logs', actions: ['read'] },
    ],

    // Bank of Botswana (BoB) - Central Bank
    // Focus: Prudential supervision, financial stability, liquidity, capital adequacy
    [UserRole.BOB_PRUDENTIAL_SUPERVISOR]: [
        { resource: 'tenants', actions: ['read', 'update'] },
        { resource: 'financial_stability', actions: ['read', 'update'] },
        { resource: 'liquidity_reports', actions: ['read'] },
        { resource: 'capital_adequacy', actions: ['read', 'update'] },
        { resource: 'accounts', actions: ['read'] },
        { resource: 'transactions', actions: ['read'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'audit_logs', actions: ['read'] },
    ],

    [UserRole.BOB_FINANCIAL_AUDITOR]: [
        { resource: 'tenants', actions: ['read'] },
        { resource: 'members', actions: ['read'] },
        { resource: 'loans', actions: ['read'] },
        { resource: 'accounts', actions: ['read'] },
        { resource: 'transactions', actions: ['read'] },
        { resource: 'financial_stability', actions: ['read'] },
        { resource: 'liquidity_reports', actions: ['read'] },
        { resource: 'reports', actions: ['read'] },
    ],

    [UserRole.BOB_COMPLIANCE_OFFICER]: [
        { resource: 'tenants', actions: ['read'] },
        { resource: 'financial_stability', actions: ['read'] },
        { resource: 'capital_adequacy', actions: ['read'] },
        { resource: 'kyc', actions: ['read'] },
        { resource: 'reports', actions: ['read'] },
        { resource: 'audit_logs', actions: ['read'] },
    ],

    // Shared Regulatory Functions
    [UserRole.DEDUCTION_OFFICER]: [
        { resource: 'deductions', actions: ['read', 'update', 'approve'] },
        { resource: 'reconciliations', actions: ['create', 'read', 'update'] },
        { resource: 'reports', actions: ['read'] },
    ],

    // Government Registration Officers
    [UserRole.REGISTRY_CLERK]: [
        { resource: 'applications', actions: ['read', 'update'] },
        { resource: 'application_completeness', actions: ['approve'] },
    ],

    [UserRole.INTELLIGENCE_LIAISON]: [
        { resource: 'applications', actions: ['read'] },
        { resource: 'application_security', actions: ['update', 'approve'] },
    ],

    [UserRole.LEGAL_OFFICER]: [
        { resource: 'applications', actions: ['read'] },
        { resource: 'application_legal', actions: ['update', 'approve'] },
    ],

    [UserRole.REGISTRAR]: [
        { resource: 'applications', actions: ['read', 'approve'] },
        { resource: 'certificates', actions: ['create'] },
    ],

    [UserRole.DIRECTOR_COOPERATIVES]: [
        { resource: 'applications', actions: ['read', 'approve'] },
        { resource: 'certificates', actions: ['create'] },
    ],

    [UserRole.MINISTER_DELEGATE]: [
        { resource: 'applications', actions: ['read'] },
        { resource: 'appeals', actions: ['read', 'approve'] },
    ],

    [UserRole.SOCIETY_APPLICANT]: [
        { resource: 'applications', actions: ['create', 'read', 'update'] },
        { resource: 'application_documents', actions: ['create', 'read', 'delete'] },
        { resource: 'application_members', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'appeals', actions: ['create'] },
    ],

    [UserRole.COOPERATIVE_APPLICANT]: [
        { resource: 'applications', actions: ['create', 'read', 'update'] },
        { resource: 'application_documents', actions: ['create', 'read', 'delete'] },
        { resource: 'application_members', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'appeals', actions: ['create'] },
    ],

    // Tenant Tier - Scoped to Tenant
    [UserRole.SACCOS_ADMIN]: [
        { resource: 'users', actions: ['create', 'read', 'update'] },
        { resource: 'members', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'loans', actions: ['read', 'approve'] },
        { resource: 'insurance', actions: ['read', 'approve'] },
        { resource: 'merchandise', actions: ['read', 'approve'] },
        { resource: 'deductions', actions: ['create', 'read', 'update'] },
        { resource: 'reconciliations', actions: ['read'] },
        { resource: 'accounts', actions: ['read'] },
        { resource: 'transactions', actions: ['read'] },
        { resource: 'reports', actions: ['read'] },
    ],

    [UserRole.LOAN_OFFICER]: [
        { resource: 'members', actions: ['read'] },
        { resource: 'loans', actions: ['create', 'read', 'update'] },
        { resource: 'guarantors', actions: ['create', 'read', 'update'] },
        { resource: 'merchandise', actions: ['create', 'read', 'update'] },
    ],

    [UserRole.ACCOUNTANT]: [
        { resource: 'members', actions: ['read'] },
        { resource: 'accounts', actions: ['create', 'read', 'update'] },
        { resource: 'transactions', actions: ['create', 'read', 'update'] },
        { resource: 'reconciliations', actions: ['create', 'read', 'update'] },
        { resource: 'insurance', actions: ['read', 'update'] },
        { resource: 'merchandise', actions: ['read', 'update'] },
        { resource: 'reports', actions: ['read'] },
    ],

    [UserRole.MEMBER_SERVICE_REP]: [
        { resource: 'members', actions: ['create', 'read', 'update'] },
        { resource: 'kyc', actions: ['create', 'read', 'update'] },
        { resource: 'beneficiaries', actions: ['create', 'read', 'update'] },
        { resource: 'insurance', actions: ['create', 'read'] },
    ],

    [UserRole.CREDIT_COMMITTEE]: [
        { resource: 'loans', actions: ['read', 'approve'] },
        { resource: 'merchandise', actions: ['read', 'approve'] },
    ],

    // Member Tier - Self-Service Only
    [UserRole.MEMBER]: [
        { resource: 'profile', actions: ['read', 'update'] },
        { resource: 'savings', actions: ['read'] },
        { resource: 'loans', actions: ['create', 'read'] },
        { resource: 'insurance', actions: ['read'] },
        { resource: 'merchandise', actions: ['create', 'read'] },
        { resource: 'statements', actions: ['read'] },
    ],

    // External
    [UserRole.EXTERNAL_AUDITOR]: [
        { resource: 'accounts', actions: ['read'] },
        { resource: 'transactions', actions: ['read'] },
        { resource: 'reports', actions: ['read'] },
    ],

    [UserRole.VENDOR]: [
        { resource: 'merchandise_orders', actions: ['read', 'update'] },
    ],
};

export function hasPermission(
    role: UserRole,
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete' | 'approve'
): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    const resourcePermission = permissions.find((p) => p.resource === resource);
    return resourcePermission?.actions.includes(action) ?? false;
}

export function canAccessTenant(role: UserRole, userTenantId: string | null, targetTenantId: string): boolean {
    // Super Regulator and other administrative regulatory roles have global access
    if (role === UserRole.SUPER_REGULATOR) return true;

    // DCD, BoB, and government officers can access all tenants
    if ([
        // DCD roles
        UserRole.DCD_DIRECTOR,
        UserRole.DCD_FIELD_OFFICER,
        UserRole.DCD_COMPLIANCE_OFFICER,
        // BoB roles
        UserRole.BOB_PRUDENTIAL_SUPERVISOR,
        UserRole.BOB_FINANCIAL_AUDITOR,
        UserRole.BOB_COMPLIANCE_OFFICER,
        // Shared
        UserRole.DEDUCTION_OFFICER,
        // Government registration officers
        UserRole.REGISTRY_CLERK,
        UserRole.INTELLIGENCE_LIAISON,
        UserRole.LEGAL_OFFICER,
        UserRole.REGISTRAR,
        UserRole.DIRECTOR_COOPERATIVES,
        UserRole.MINISTER_DELEGATE,
    ].includes(role)) {
        return true;
    }

    // Tenant users can only access their own tenant
    return userTenantId === targetTenantId;
}

export function requiresMFA(role: UserRole): boolean {
    return [
        UserRole.SUPER_REGULATOR,
        // DCD roles
        UserRole.DCD_DIRECTOR,
        UserRole.DCD_FIELD_OFFICER,
        UserRole.DCD_COMPLIANCE_OFFICER,
        // BoB roles
        UserRole.BOB_PRUDENTIAL_SUPERVISOR,
        UserRole.BOB_FINANCIAL_AUDITOR,
        UserRole.BOB_COMPLIANCE_OFFICER,
        // Shared
        UserRole.DEDUCTION_OFFICER,
        // SACCOS roles
        UserRole.SACCOS_ADMIN,
        UserRole.ACCOUNTANT,
        // Government officers handling sensitive registration data
        UserRole.REGISTRAR,
        UserRole.DIRECTOR_COOPERATIVES,
        UserRole.MINISTER_DELEGATE,
    ].includes(role);
}
