import { UserRole } from '../src/entities/User';
import { hasPermission, canAccessTenant, requiresMFA } from '../lib/rbac';

console.log('=== SUPER_REGULATOR RBAC Verification ===\n');

// Test 1: Permission checks
console.log('Test 1: Permission Checks');
console.log('-------------------------');
const testResources = [
    { resource: 'tenants', action: 'create' as const },
    { resource: 'users', action: 'delete' as const },
    { resource: 'system_settings', action: 'update' as const },
    { resource: 'platform_analytics', action: 'read' as const },
    { resource: 'applications', action: 'approve' as const },
];

testResources.forEach(({ resource, action }) => {
    const result = hasPermission(UserRole.SUPER_REGULATOR, resource, action);
    console.log(`  ✓ hasPermission(SUPER_REGULATOR, '${resource}', '${action}'): ${result ? '✅ PASS' : '❌ FAIL'}`);
});

// Test 2: Tenant access
console.log('\nTest 2: Tenant Access');
console.log('---------------------');
const testTenantIds = ['tenant-1', 'tenant-2', 'tenant-3'];
testTenantIds.forEach(tenantId => {
    const result = canAccessTenant(UserRole.SUPER_REGULATOR, null, tenantId);
    console.log(`  ✓ canAccessTenant(SUPER_REGULATOR, null, '${tenantId}'): ${result ? '✅ PASS' : '❌ FAIL'}`);
});

// Test 3: MFA requirement
console.log('\nTest 3: MFA Requirement');
console.log('-----------------------');
const mfaRequired = requiresMFA(UserRole.SUPER_REGULATOR);
console.log(`  ✓ requiresMFA(SUPER_REGULATOR): ${mfaRequired ? '✅ PASS (MFA Required)' : '❌ FAIL (MFA Not Required)'}`);

// Test 4: Compare with other roles
console.log('\nTest 4: Role Comparison');
console.log('-----------------------');
const regularRole = UserRole.DCD_DIRECTOR;
const superRegulatorSystemAccess = hasPermission(UserRole.SUPER_REGULATOR, 'system_settings', 'update');
const regularRoleSystemAccess = hasPermission(regularRole, 'system_settings', 'update');
console.log(`  ✓ SUPER_REGULATOR has system_settings access: ${superRegulatorSystemAccess ? '✅ YES' : '❌ NO'}`);
console.log(`  ✓ ${regularRole} has system_settings access: ${regularRoleSystemAccess ? '❌ YES (UNEXPECTED)' : '✅ NO (EXPECTED)'}`);

console.log('\n=== Verification Complete ===');
