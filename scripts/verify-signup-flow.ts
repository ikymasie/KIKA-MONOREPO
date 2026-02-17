import { AppDataSource } from '../src/config/database';
import { User, UserRole, UserStatus } from '../src/entities/User';
import { getFirebaseUserByEmail, deleteFirebaseUser } from '../lib/firebase-auth';

async function verifySignupFlow() {
    console.log('--- Starting Signup Flow Verification ---');

    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const testEmail = `new_applicant_${Date.now()}@test.kika.gov.bw`;
        const testPassword = 'TestPassword123!';
        const testRole = UserRole.COOPERATIVE_APPLICANT;

        console.log(`Testing signup with email: ${testEmail}`);

        // We'll simulate the API logic here since we're in a script
        const userRepository = AppDataSource.getRepository(User);

        // 1. Create In Database
        const newUser = userRepository.create({
            email: testEmail,
            firstName: 'Signup',
            lastName: 'Test',
            role: testRole,
            status: UserStatus.ACTIVE,
        });
        await userRepository.save(newUser);
        console.log('✅ User created in MySQL');

        // 2. Sync with Firebase (manual sync for test)
        const { syncUserWithFirebase } = await import('../lib/firebase-auth');
        const firebaseUid = await syncUserWithFirebase(testEmail, testPassword, newUser);
        console.log('✅ User created/synced in Firebase UID:', firebaseUid);

        // 3. Verify Firebase custom claims
        const { adminAuth } = await import('../lib/firebase-admin');
        const firebaseUser = await adminAuth.getUser(firebaseUid);
        console.log('✅ Firebase user retrieved');
        console.log('   Custom Claims:', firebaseUser.customClaims);

        if (firebaseUser.customClaims?.role === testRole) {
            console.log('✅ Role claim verified');
        } else {
            throw new Error(`Role claim mismatch: expected ${testRole}, got ${firebaseUser.customClaims?.role}`);
        }

        // Cleanup
        console.log('Cleaning up...');
        await userRepository.remove(newUser);
        await deleteFirebaseUser(firebaseUid);
        console.log('✅ Test data cleaned up');

        console.log('\n--- Verification Successful ---');
    } catch (error) {
        console.error('\n❌ Verification Failed:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

verifySignupFlow();
