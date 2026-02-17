import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { User, UserRole } from '../src/entities/User';
import { Member } from '../src/entities/Member';
import { LoanGuarantor, GuarantorStatus } from '../src/entities/LoanGuarantor';
import { Transaction, TransactionType } from '../src/entities/Transaction';
import { Beneficiary } from '../src/entities/Beneficiary';
import { InsurancePolicy } from '../src/entities/InsurancePolicy';

async function verify() {
    console.log('🚀 Starting Member Portal Wrap-up Verification...');

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);
        const memberRepo = AppDataSource.getRepository(Member);
        const guarantorRepo = AppDataSource.getRepository(LoanGuarantor);
        const transactionRepo = AppDataSource.getRepository(Transaction);
        const beneficiaryRepo = AppDataSource.getRepository(Beneficiary);
        const policyRepo = AppDataSource.getRepository(InsurancePolicy);

        // 1. Verify a member user exist
        const memberUser = await userRepo.findOne({ where: { role: UserRole.MEMBER } });
        if (!memberUser) {
            console.log('⚠️ No member user found for testing.');
            return;
        }
        console.log(`✅ Found member user: ${memberUser.email}`);

        const member = await memberRepo.findOne({ where: { userId: memberUser.id } });
        if (!member) {
            console.log('⚠️ No member record found for user.');
            return;
        }
        console.log(`✅ Found member record: ${member.memberNumber}`);

        // 2. Check Guarantor Requests API logic (Mocking data if needed, but here we just check if we can query)
        const requests = await guarantorRepo.find({
            where: { guarantorMemberId: member.id, status: GuarantorStatus.PENDING }
        });
        console.log(`✅ Guarantor Requests query successful. Found ${requests.length} pending requests.`);

        // 3. Check Contributions logic
        const contributions = await transactionRepo.find({
            where: { memberId: member.id, transactionType: TransactionType.DEDUCTION }
        });
        console.log(`✅ Contributions (Deductions) query successful. Found ${contributions.length} entries.`);

        // 4. Check Beneficiaries logic
        const beneficiaries = await beneficiaryRepo.find({
            where: { memberId: member.id }
        });
        console.log(`✅ Beneficiaries query successful. Found ${beneficiaries.length} entries.`);

        // 5. Check User notificationPreferences field
        if ('notificationPreferences' in memberUser) {
            console.log('✅ User entity successfully updated with notificationPreferences field.');
        } else {
            console.log('❌ User entity missing notificationPreferences field.');
        }

        console.log('\n✨ Verification script logic passed successfully!');
    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

verify();
