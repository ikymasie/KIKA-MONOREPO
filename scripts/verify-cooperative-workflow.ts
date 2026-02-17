import { AppDataSource } from '../src/config/database';
import { SocietyApplicationService } from '../src/services/SocietyApplicationService';
import { ApplicationType, ApplicationStatus } from '../src/entities/SocietyApplication';
import { User, UserRole, UserStatus } from '../src/entities/User';
import { ApplicationMember } from '../src/entities/ApplicationMember';
import { ApplicationDocument } from '../src/entities/ApplicationDocument';

async function verifyCooperativeWorkflow() {
    console.log('--- Starting Cooperative Workflow Verification ---');

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const userRepo = AppDataSource.getRepository(User);
        let testUser = await userRepo.findOneBy({ email: 'coop_test@kika.gov.bw' });

        if (!testUser) {
            testUser = userRepo.create({
                email: 'coop_test@kika.gov.bw',
                firstName: 'Coop',
                lastName: 'Test',
                role: UserRole.COOPERATIVE_APPLICANT,
                status: UserStatus.ACTIVE,
                firebaseUid: 'coop_test_uid'
            });
            await userRepo.save(testUser);
            console.log('✅ Test cooperative user created');
        }

        // 1. Create Cooperative Application
        const application = await SocietyApplicationService.createApplication({
            proposedName: 'Test Cooperative Society 2026',
            applicationType: ApplicationType.COOPERATIVE,
            primaryContactName: 'Coop Test',
            primaryContactEmail: 'coop_test@kika.gov.bw',
            primaryContactPhone: '+267 71000000',
            physicalAddress: 'Plot 5678, Gaborone'
        }, testUser);
        console.log('✅ Cooperative application created:', application.id);
        console.log('   Fee calculated:', application.feeAmount);

        // 2. Add Member
        const member = await SocietyApplicationService.addMember(application.id, {
            fullName: 'Founding Member 1',
            idNumber: '123456789',
            citizenship: 'Botswana',
            isOfficeBearer: true,
            officeBearerTitle: 'Chairman'
        });
        console.log('✅ Member added to cooperative');

        // 3. Add Document
        const document = await SocietyApplicationService.addDocument(application.id, {
            documentType: 'constitution',
            fileName: 'bylaws.pdf',
            fileUrl: 'https://firebasestorage.local/bylaws.pdf'
        }, testUser.id);
        console.log('✅ Document added to cooperative');

        // 4. Submit Application
        application.status = ApplicationStatus.SUBMITTED;
        application.submittedAt = new Date();
        await AppDataSource.getRepository('SocietyApplication').save(application);
        console.log('✅ Cooperative application submitted');

        // 5. Verify retrieval
        const list = await SocietyApplicationService.getApplicantApplications(testUser.id);
        console.log('✅ Retrieved applicant applications count:', list.length);

        const found = list.find(a => a.id === application.id);
        if (found && found.applicationType === ApplicationType.COOPERATIVE) {
            console.log('✅ Cooperative application verified in list');
        } else {
            throw new Error('Cooperative application not found correctly in list');
        }

        console.log('\n--- Verification Successful ---');
    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

verifyCooperativeWorkflow();
