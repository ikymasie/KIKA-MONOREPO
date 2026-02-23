import { AppDataSource } from '../src/config/database';
import { SocietyApplicationService } from '../src/services/SocietyApplicationService';
import { ApplicationType, ApplicationStatus } from '../src/entities/SocietyApplication';
import { User, UserRole } from '../src/entities/User';

async function verify() {
    try {
        console.log('🚀 Starting SOCIETY_APPLICANT workflow verification...');

        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const userRepo = AppDataSource.getRepository(User);

        // 1. Find or create an applicant user
        let applicant = await userRepo.findOneBy({ role: UserRole.SOCIETY_APPLICANT });
        if (!applicant) {
            applicant = userRepo.create({
                firstName: 'Test',
                lastName: 'Applicant',
                email: 'applicant@test.com',
                role: UserRole.SOCIETY_APPLICANT,
                firebaseUid: 'test-applicant-uid'
            });
            await userRepo.save(applicant);
            console.log('✅ Created test applicant');
        }

        // 2. Create a new application
        console.log('📝 Creating application...');
        const app = await SocietyApplicationService.createApplication({
            applicationType: ApplicationType.GENERAL_SOCIETY,
            proposedName: 'Test Society ' + Date.now(),
            primaryContactName: 'Test Contact',
            primaryContactEmail: 'contact@test.com',
            primaryContactPhone: '71000000',
            physicalAddress: 'Test Address'
        }, applicant);
        console.log(`✅ Application created: ${app.id} (${app.status})`);

        // 3. Add members
        console.log('👥 Adding members...');
        const member1 = await SocietyApplicationService.addMember(app.id, {
            fullName: 'Member One',
            idNumber: '123456789',
            citizenship: 'Botswana Citizen',
            isOfficeBearer: true,
            officeBearerPosition: 'Chairperson'
        });
        const member2 = await SocietyApplicationService.addMember(app.id, {
            fullName: 'Member Two',
            idNumber: '987654321',
            citizenship: 'Botswana Citizen',
            isOfficeBearer: false
        });
        console.log('✅ Members added');

        // 4. Add documents
        console.log('📂 Adding documents...');
        await SocietyApplicationService.addDocument(app.id, {
            documentType: 'constitution',
            fileName: 'constitution.pdf',
            fileUrl: 'https://test.com/const.pdf'
        }, applicant.id!);
        console.log('✅ Documents added');

        // 5. Submit application
        console.log('📤 Submitting application...');
        const submittedApp = await SocietyApplicationService.updateApplication(app.id, {
            status: ApplicationStatus.SUBMITTED,
            submittedAt: new Date()
        }, applicant.id);
        console.log(`✅ Application submitted! Status: ${submittedApp.status}`);

        // 6. Verify retrieval
        const foundApp = await SocietyApplicationService.getApplicantApplication(app.id, applicant.id!);
        if (foundApp && foundApp.status === ApplicationStatus.SUBMITTED) {
            console.log('✅ Verification successful! Workflow is functional.');
        } else {
            console.log('❌ Verification failed: Application not found or status incorrect');
        }

        await AppDataSource.destroy();
    } catch (error) {
        console.error('❌ Verification failed with error:', error);
        process.exit(1);
    }
}

verify();
