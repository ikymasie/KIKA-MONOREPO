import { FieldOfficerService } from '../src/services/FieldOfficerService';
import { FieldVisitStatus } from '../src/entities/FieldVisit';
import { InvestigationStatus, InvestigationSeverity } from '../src/entities/Investigation';
import { AppDataSource } from '../src/config/database';

async function verifyFieldOfficer() {
    try {
        console.log('--- Verification Started ---');

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        // 1. Fetch some sacrificial entities for testing
        const tenantRepo = AppDataSource.getRepository('Tenant');
        const userRepo = AppDataSource.getRepository('User');

        const tenant = await tenantRepo.findOne({ where: {}, select: { id: true } });
        const officer = await userRepo.findOne({ where: { role: 'dcd_field_officer' }, select: { id: true } })
            || await userRepo.findOne({ where: {}, select: { id: true } });

        if (!tenant || !officer) {
            console.error('Test data missing (tenant or officer)');
            return;
        }

        console.log(`Using Tenant: ${tenant.id}, Officer: ${officer.id}`);

        // 2. Test Scheduling a Visit
        console.log('Testing: Schedule Visit...');
        const visit = await FieldOfficerService.scheduleVisit({
            tenantId: tenant.id,
            officerId: officer.id,
            scheduledDate: new Date(),
            purpose: 'Verification Test Visit',
            notes: 'Automated test'
        });
        console.log('✅ Visit Scheduled:', visit.id);

        // 3. Test Initiating an Investigation
        console.log('Testing: Initiate Investigation...');
        const investigation = await FieldOfficerService.initiateInvestigation({
            tenantId: tenant.id,
            officerId: officer.id,
            subject: 'Test Investigation',
            description: 'Automated test for investigation tracking',
            severity: InvestigationSeverity.MEDIUM
        });
        console.log('✅ Investigation Initiated:', investigation.id);

        // 4. Test submitting a report
        console.log('Testing: Submit Report...');
        const report = await FieldOfficerService.submitReport({
            visitId: visit.id,
            tenantId: tenant.id,
            submittedById: officer.id,
            cooperativePrinciplesChecklist: {
                voluntaryMembership: true,
                democraticControl: true,
                memberEconomicParticipation: false,
                autonomyIndependence: true,
                educationTrainingInformation: true,
                cooperationAmongCooperatives: true,
                concernForCommunity: true,
                notes: 'Test notes'
            },
            generalFindings: 'Everything looks mostly good.',
            recommendations: 'Improve economic participation.'
        });
        console.log('✅ Report Submitted:', report.id);

        // 5. Verify Visit status updated
        const updatedVisit = await AppDataSource.getRepository('FieldVisit').findOneBy({ id: visit.id });
        if (updatedVisit?.status === FieldVisitStatus.COMPLETED) {
            console.log('✅ Visit Status Updated to COMPLETED');
        } else {
            console.log('❌ Visit Status NOT Updated');
        }

        console.log('--- Verification Finished ---');
    } catch (error) {
        console.error('--- Verification Failed ---', error);
    } finally {
        process.exit();
    }
}

verifyFieldOfficer();
