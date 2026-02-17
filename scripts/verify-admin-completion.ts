import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from '../src/config/database';
import { AgmResolution } from '../src/entities/AgmResolution';
import { BoardMinute } from '../src/entities/BoardMinute';
import { Bylaw } from '../src/entities/Bylaw';
import { ByelawReview } from '../src/entities/ByelawReview';
import { MemberCommunication } from '../src/entities/MemberCommunication';
import { Tenant } from '../src/entities/Tenant';

async function verifyAdminCompletion() {
    console.log('🚀 Starting SACCOS Admin Module Verification...');

    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const tenant = await AppDataSource.getRepository(Tenant).findOne({ where: {} });
        if (!tenant) {
            console.log('❌ No tenant found to test with.');
            return;
        }

        console.log(`Using Tenant: ${tenant.name} (${tenant.id})`);

        // 1. Verify AGM Resolution
        const agmRepo = AppDataSource.getRepository(AgmResolution);
        const resolution = agmRepo.create({
            tenantId: tenant.id,
            year: 2026,
            date: new Date(),
            title: 'Test Resolution',
            description: 'Verify system implementation',
            status: 'pending' as any,
        });
        await agmRepo.save(resolution);
        console.log('✅ AgmResolution entity and repo working.');

        // 2. Verify Board Minutes
        const boardRepo = AppDataSource.getRepository(BoardMinute);
        const meeting = boardRepo.create({
            tenantId: tenant.id,
            meetingDate: new Date(),
            location: 'Virtual',
            attendees: ['Admin User'],
        });
        await boardRepo.save(meeting);
        console.log('✅ BoardMinute entity and repo working.');

        // 3. Verify Bye-laws Review
        const reviewRepo = AppDataSource.getRepository(ByelawReview);
        const review = reviewRepo.create({
            tenantId: tenant.id,
            bylawDocumentUrl: 'http://test.com/bylaw.pdf',
            version: 1,
            submittedAt: new Date(),
            status: 'pending' as any,
        });
        await reviewRepo.save(review);
        console.log('✅ ByelawReview entity and repo working.');

        console.log('\n✨ All entities verified successfully!');

        // Clean up test data
        await agmRepo.remove(resolution);
        await boardRepo.remove(meeting);
        await reviewRepo.remove(review);
        console.log('🧹 Test data cleaned up.');

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

verifyAdminCompletion();
