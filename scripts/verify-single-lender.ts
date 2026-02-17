import { AppDataSource } from '../src/config/database';
import { Member, MemberStatus, EmploymentStatus } from '../src/entities/Member';
import { Tenant } from '../src/entities/Tenant';
import { DeductionRequest, DeductionRequestStatus } from '../src/entities/DeductionRequest';
import { DeductionItem, ChangeReason } from '../src/entities/DeductionItem';
import { DeltaDeductionEngine } from '../lib/deductions/delta-engine';
import { MemberSavings } from '../src/entities/MemberSavings';

async function verify() {
    console.log('--- Starting Single Lender Rule Verification ---');

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const memberRepo = AppDataSource.getRepository(Member);
    const savingsRepo = AppDataSource.getRepository(MemberSavings);

    // 1. Setup Test Tenants
    console.log('1. Setting up test tenants...');
    let tenantA = await tenantRepo.findOne({ where: { code: 'TENANT_A' } });
    if (!tenantA) {
        tenantA = tenantRepo.create({
            name: 'SACCOS Alpha',
            code: 'TENANT_A',
            maxDeductionPercentage: 40,
            regulatorDeductionCap: 100000
        });
        await tenantRepo.save(tenantA);
    }

    let tenantB = await tenantRepo.findOne({ where: { code: 'TENANT_B' } });
    if (!tenantB) {
        tenantB = tenantRepo.create({
            name: 'SACCOS Beta',
            code: 'TENANT_B',
            maxDeductionPercentage: 50, // Beta has higher limit
            regulatorDeductionCap: 100000
        });
        await tenantRepo.save(tenantB);
    }

    const nationalId = 'ID-' + Math.random().toString(36).substring(7);

    // 2. Create Member in Tenant A
    console.log('2. Creating member in Tenant A...');
    const memberA = memberRepo.create({
        tenantId: tenantA.id,
        memberNumber: 'M-101',
        firstName: 'Dual',
        lastName: 'Member',
        nationalId,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Female',
        email: `dual.${nationalId}@test.com`,
        phone: '12345678',
        employmentStatus: EmploymentStatus.EMPLOYED,
        joinDate: new Date(),
        status: MemberStatus.ACTIVE,
        monthlyNetSalary: 10000 // P10,000 net income
    });
    await memberRepo.save(memberA);

    // 3. Create Member in Tenant B (Simulating dual membership)
    console.log('3. Creating member in Tenant B (Dual Membership)...');
    const memberB = memberRepo.create({
        tenantId: tenantB.id,
        memberNumber: 'M-201',
        firstName: 'Dual',
        lastName: 'Member',
        nationalId,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Female',
        email: `dual.${nationalId}@test.com`,
        phone: '12345678',
        employmentStatus: EmploymentStatus.EMPLOYED,
        joinDate: new Date(),
        status: MemberStatus.ACTIVE,
        monthlyNetSalary: 10000
    });
    await memberRepo.save(memberB);

    // 4. Setup Savings (Deductions)
    console.log('4. Setting up savings commitments...');
    // Tenant A: P3,000 (30%)
    await savingsRepo.save(savingsRepo.create({
        memberId: memberA.id,
        monthlyContribution: 3000,
        isActive: true,
        currentBalance: 0,
        productName: 'Voluntary Savings'
    } as any));

    // Tenant B: P2,000 (20%)
    // Total Combined: P5,000 (50%)
    await savingsRepo.save(savingsRepo.create({
        memberId: memberB.id,
        monthlyContribution: 2000,
        isActive: true,
        currentBalance: 0,
        productName: 'Shares'
    } as any));

    // 5. Run Deduction Engine for Tenant A
    console.log('5. Running Deduction Engine for Tenant A (Alpha)...');
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const engineA = new DeltaDeductionEngine(tenantA.id, month, year);
    const requestA = await engineA.generateDeductionRequest();

    const itemA = await AppDataSource.getRepository(DeductionItem).findOne({
        where: { requestId: requestA.id, memberId: memberA.id }
    });

    console.log(`Tenant A Result: Amount=P${itemA?.currentAmount}, OverLimit=${itemA?.isOverLimit}`);
    console.log(`Notes: ${itemA?.limitNotes}`);

    // 6. Run Deduction Engine for Tenant B
    console.log('6. Running Deduction Engine for Tenant B (Beta)...');
    const engineB = new DeltaDeductionEngine(tenantB.id, month, year);
    const requestB = await engineB.generateDeductionRequest();

    const itemB = await AppDataSource.getRepository(DeductionItem).findOne({
        where: { requestId: requestB.id, memberId: memberB.id }
    });

    console.log(`Tenant B Result: Amount=P${itemB?.currentAmount}, OverLimit=${itemB?.isOverLimit}`);
    console.log(`Notes: ${itemB?.limitNotes}`);

    // Validation
    // For Tenant A (Alpha): P3k + P2k = P5k. Limit is 40% of 10k = P4k. Result: OVER LIMIT.
    // For Tenant B (Beta): P2k + P3k = P5k. Limit is 50% of 10k = P5k. Result: WITHIN LIMIT (or exactly at limit).

    if (itemA?.isOverLimit === true && itemB?.isOverLimit === false) {
        console.log('\n✅ VERIFICATION SUCCESSFUL');
    } else {
        console.log('\n❌ VERIFICATION FAILED');
    }
}

verify().catch(console.error);
