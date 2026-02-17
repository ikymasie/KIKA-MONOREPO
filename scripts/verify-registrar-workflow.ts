import { AppDataSource } from '../src/config/database';
import { SocietyApplication, ApplicationStatus, ApplicationType } from '../src/entities/SocietyApplication';
import { User, UserRole } from '../src/entities/User';
import { RegistrationService } from '../src/services/RegistrationService';

async function verifyRegistrarWorkflow() {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        console.log('🚀 Starting Registrar Workflow Verification...');

        const appRepo = AppDataSource.getRepository(SocietyApplication);
        const userRepo = AppDataSource.getRepository(User);

        // 1. Setup a dummy Registrar
        let registrar = await userRepo.findOneBy({ role: UserRole.REGISTRAR });
        if (!registrar) {
            console.log('Creating dummy Registrar...');
            registrar = userRepo.create({
                email: 'registrar_test@kika.bw',
                firstName: 'Test',
                lastName: 'Registrar',
                role: UserRole.REGISTRAR,
                firebaseUid: 'test-registrar-uid'
            });
            await userRepo.save(registrar);
        }

        // 2. Setup a dummy application in PENDING_DECISION status
        console.log('Creating dummy application...');
        const application = appRepo.create({
            proposedName: 'Test Society ' + Date.now(),
            applicationType: ApplicationType.GENERAL_SOCIETY,
            status: ApplicationStatus.PENDING_DECISION,
            applicantUserId: registrar.id, // self-test
            primaryContactName: 'John Doe',
            primaryContactEmail: 'john@example.com',
            primaryContactPhone: '71000000',
            physicalAddress: 'Gaborone, Botswana',
            feeAmount: 250
        });
        await appRepo.save(application);
        console.log(`✅ Application created: ${application.id}`);

        // 3. Approve via RegistrationService
        console.log('Approving application...');
        const approvedApp = await RegistrationService.approveApplication(application.id, registrar.id, 'Verified and approved.');

        if (approvedApp.status === ApplicationStatus.APPROVED && approvedApp.certificateNumber) {
            console.log(`✅ Application approved! Reg #: ${approvedApp.certificateNumber}`);
        } else {
            throw new Error('Approval failed: Status not updated or Reg # not assigned');
        }

        // 4. Issue Certificate
        console.log('Issuing certificate...');
        const certificate = await RegistrationService.issueCertificate(application.id, registrar.id);

        if (certificate && certificate.certificateNumber === approvedApp.certificateNumber) {
            console.log(`✅ Certificate issued: ${certificate.id}`);
        } else {
            throw new Error('Certificate issuance failed');
        }

        // 5. Verify Registry
        const registry = await RegistrationService.getOfficialRegistry();
        const found = registry.find(s => s.id === application.id);
        if (found) {
            console.log('✅ Entry found in Official Registry');
        } else {
            throw new Error('Entry not found in Official Registry');
        }

        console.log('\n✨ ALL REGISTRAR WORKFLOW TESTS PASSED! ✨');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}

verifyRegistrarWorkflow();
