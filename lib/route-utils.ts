/**
 * Get the dashboard route for a given user role
 */
export function getRoleBasedRoute(role: string): string {
    console.log('[getRoleBasedRoute] Input role:', role);

    // DCD and BoB regulatory roles
    const regulatorRoles = [
        'super_regulator',
        'dcd_director',
        'dcd_field_officer',
        'dcd_compliance_officer',
        'bob_prudential_supervisor',
        'bob_financial_auditor',
        'bob_compliance_officer',
        'deduction_officer',
    ];

    // Government registration officers (work with DCD, use regulator dashboard)
    const governmentRoles = [
        'registry_clerk',
        'intelligence_liaison',
        'legal_officer',
        'registrar',
        'director_cooperatives',
        'minister_delegate',
    ];

    // SACCOS admin and staff roles
    const adminRoles = [
        'saccos_admin',
        'loan_officer',
        'accountant',
        'member_service_rep',
        'credit_committee',
        'external_auditor', // External auditors access admin dashboard for reports
    ];

    // Applicant roles
    const applicantRoles = [
        'society_applicant',
        'cooperative_applicant',
    ];

    if (regulatorRoles.includes(role) || governmentRoles.includes(role)) {
        console.log('[getRoleBasedRoute] Matched regulator/government role, returning /regulator/dashboard');
        return '/regulator/dashboard';
    }

    if (adminRoles.includes(role)) {
        console.log('[getRoleBasedRoute] Matched admin role, returning /admin/dashboard');
        return '/admin/dashboard';
    }

    if (role === 'member') {
        console.log('[getRoleBasedRoute] Matched member role, returning /member/dashboard');
        return '/member/dashboard';
    }

    if (applicantRoles.includes(role)) {
        console.log('[getRoleBasedRoute] Matched applicant role, returning /applications');
        return '/applications';
    }

    if (role === 'vendor') {
        console.log('[getRoleBasedRoute] Matched vendor role, returning /vendor/portal');
        return '/vendor/portal';
    }

    // Default fallback - log warning
    console.warn('[getRoleBasedRoute] No matching role found for:', role, '- returning homepage');
    return '/';
}

