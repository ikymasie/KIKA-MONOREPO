import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { SocietyApplicationService } from '../src/services/SocietyApplicationService';
import { ApplicationStatus, ApplicationType } from '../src/entities/SocietyApplication';
import { User, UserRole } from '../src/entities/User';
import { ScreeningStatus, RiskLevel } from '../src/entities/SecurityScreening';

async function verifyIntelligenceModule() {
    console.log('🚀 Starting Intelligence Module Verification...');

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const applicationRepo = AppDataSource.getRepository('SocietyApplication');
        const userRepo = AppDataSource.getRepository(User);

        // 1. Create a test officer
        let officer = await userRepo.findOneBy({ role: UserRole.INTELLIGENCE_LIAISON });
        if (!officer) {
            officer = userRepo.create({
                email: 'intel@test.com',
                firstName: 'Intelligence',
                lastName: 'Officer',
                role: UserRole.INTELLIGENCE_LIAISON,
                status: 'active' as any
            });
            await userRepo.save(officer);
        }
        console.log('✅ Intelligence Officer ready:', officer.id);

        // 2. Create a test application pending vetting
        const application = applicationRepo.create({
            proposedName: 'Intelligence Test Society',
            applicationType: ApplicationType.GENERAL_SOCIETY,
            status: ApplicationStatus.SECURITY_VETTING,
            applicantUserId: officer.id, // placeholder
            primaryContactName: 'Test Contact',
            primaryContactEmail: 'test@contact.com',
            primaryContactPhone: '12345678',
            physicalAddress: '123 Test St',
            intelligenceLiaisonId: officer.id
        });
        await applicationRepo.save(application);
        console.log('✅ Test application created:', application.id);

        // 3. Add a risk flag
        const screeningResult = await SocietyApplicationService.submitSecurityClearance(
            application.id,
            officer.id,
            false,
            'Initial findings: suspicious linkages found.',
            RiskLevel.MEDIUM
        );
        console.log('✅ Initial vetting submitted');

        const screening = await SocietyApplicationService.getSecurityScreening(application.id);
        if (!screening) throw new Error('Screening record not created');

        const flag = await SocietyApplicationService.addRiskFlag(screening.id, {
            type: 'financial' as any,
            description: 'Unexplained source of wealth for board member X'
        });
        console.log('✅ Risk flag added:', flag.id);

        // 4. Resolve flag and clear application
        await SocietyApplicationService.resolveRiskFlag(flag.id, officer.id);
        console.log('✅ Risk flag resolved');

        await SocietyApplicationService.submitSecurityClearance(
            application.id,
            officer.id,
            true,
            'All issues resolved. Background check results are clear.',
            RiskLevel.LOW
        );
        console.log('✅ Final clearance submitted');

        const updatedApp = await applicationRepo.findOneBy({ id: application.id });
        if (updatedApp?.status !== ApplicationStatus.LEGAL_REVIEW) {
            throw new Error(`Invalid application status: ${updatedApp?.status}`);
        }
        console.log('✅ Application status successfully updated to LEGAL_REVIEW');

        // Cleanup
        await applicationRepo.remove(application);
        console.log('✅ Test data cleaned up');

        console.log('\n✨ Intelligence Module Verification PASSED!');
    } catch (error) {
        console.error('\n❌ Verification FAILED:', error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}

verifyIntelligenceModule();
