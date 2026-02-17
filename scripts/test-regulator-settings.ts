import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Try .env.local first, or fallback to .env
dotenv.config();

import { AppDataSource } from '../src/config/database';
import { RegulatorSettings } from '../src/entities/RegulatorSettings';
import { SocietyApplication, ApplicationType } from '../src/entities/SocietyApplication';
import { SocietyApplicationService } from '../src/services/SocietyApplicationService';
import { User, UserRole } from '../src/entities/User';

async function testRegulatorSettings() {
    console.log('Initializing database...');
    // Force synchronize true for testing (or ensure schema sync is run before)
    // For this script, we'll assume the environment might not have the table yet.
    // However, since database.ts sets sync: false, we rely on `npm run schema:sync` or similar.
    // Let's rely on the user having run schema:sync or the tables existing. 
    // If we want to be safe in dev, we could temporarily override options, but let's stick to config.

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    console.log('Synchronizing database schema...');
    await AppDataSource.synchronize();
    console.log('Database synchronized.');

    console.log('--- Testing Regulator Settings Entity ---');
    const settingsRepo = AppDataSource.getRepository(RegulatorSettings);

    // Clear existing settings for clean test (optional, careful in prod)
    // await settingsRepo.delete({}); 

    let settings = await settingsRepo.findOne({
        where: {},
        order: { updatedAt: 'DESC' }
    });

    if (!settings) {
        console.log('No settings found, creating default...');
        settings = settingsRepo.create({});
        settings = await settingsRepo.save(settings);
    }
    console.log('Current Settings:', settings);

    // Update settings
    console.log('Updating settings...');
    settings.saccosApplicationFee = 20.00; // Reset to default
    settings.religiousSocietyApplicationFee = 500.00;
    settings.lateFilingPenaltyFee = 550.00; // Test updating penalty
    await settingsRepo.save(settings);
    console.log('Updated Settings:', settings);

    console.log('--- Testing SocietyApplication Service ---');

    // Create a mock user
    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOne({ where: {} }); // Find ANY user
    if (!user) {
        console.log('No user found to act as applicant. Creating one...');
        user = userRepo.create({
            email: 'test' + Date.now() + '@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: UserRole.SOCIETY_APPLICANT
        });
        await userRepo.save(user);
    }

    // Create application using service (SACCOS)
    console.log('Creating SACCOS application via Service...');
    const appData = {
        proposedName: 'Test SACCOS ' + Date.now(),
        applicationType: ApplicationType.SACCOS,
        primaryContactName: 'Test Contact',
        primaryContactEmail: 'test@saccos.com',
        primaryContactPhone: '12345678',
        physicalAddress: 'Test Address'
    };

    const newApp = await SocietyApplicationService.createApplication(appData, user);
    console.log('Created Application Fee:', newApp.feeAmount);

    if (Number(newApp.feeAmount) === 20.00) {
        console.log('SUCCESS: Application fee matches SACCOS settings (20.00).');
    } else {
        console.error(`FAILURE: Application fee ${newApp.feeAmount} does not match settings 20.00`);
    }

    // Create application using service (Religious - should comprise BWP 500)
    console.log('Creating Religious Society application via Service...');
    const religiousAppData = {
        proposedName: 'Test Church ' + Date.now(),
        applicationType: ApplicationType.RELIGIOUS_SOCIETY,
        primaryContactName: 'Bishop Test',
        primaryContactEmail: 'test@church.com',
        primaryContactPhone: '87654321',
        physicalAddress: 'Church Address'
    };

    const religiousApp = await SocietyApplicationService.createApplication(religiousAppData, user);
    console.log('Created Religious Application Fee:', religiousApp.feeAmount);

    if (Number(religiousApp.feeAmount) === 500.00) {
        console.log('SUCCESS: Application fee matches Religious settings (500.00).');
    } else {
        console.error(`FAILURE: Application fee ${religiousApp.feeAmount} does not match settings 500.00`);
    }

    console.log('--- Verifying Other Fees (Read Only) ---');
    console.log('Annual Return Fee:', settings.annualReturnFee);
    console.log('Late Filing Penalty:', settings.lateFilingPenaltyFee);

    process.exit(0);
}

testRegulatorSettings().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
});
