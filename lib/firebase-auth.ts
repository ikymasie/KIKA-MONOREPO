import { adminAuth } from './firebase-admin';
import { AppDataSource } from '../src/config/database';
import { User, UserRole } from '../src/entities/User';

/**
 * Sync a MySQL user with Firebase Authentication
 */
export async function syncUserWithFirebase(
    email: string,
    password: string,
    user: User
): Promise<string> {
    try {
        // Check if user already has a Firebase UID
        if (user.firebaseUid) {
            return user.firebaseUid;
        }

        // Create Firebase user
        const firebaseUser = await adminAuth.createUser({
            email,
            password,
            emailVerified: true,
            displayName: user.fullName,
        });

        // Set custom claims for RBAC
        await setUserClaims(firebaseUser.uid, {
            role: user.role,
            tenantId: user.tenantId || null,
            userId: user.id,
        });

        // Update MySQL user with Firebase UID
        user.firebaseUid = firebaseUser.uid;
        await AppDataSource.manager.save(user);

        return firebaseUser.uid;
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            // Get existing Firebase user
            const firebaseUser = await adminAuth.getUserByEmail(email);

            // Update custom claims
            await setUserClaims(firebaseUser.uid, {
                role: user.role,
                tenantId: user.tenantId || null,
                userId: user.id,
            });

            // Update MySQL user with Firebase UID
            user.firebaseUid = firebaseUser.uid;
            await AppDataSource.manager.save(user);

            return firebaseUser.uid;
        }
        throw error;
    }
}

/**
 * Get user from Firebase token
 */
export async function getUserFromFirebaseToken(
    token: string
): Promise<User | null> {
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        const firebaseUid = decodedToken.uid;

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
            where: { firebaseUid },
            relations: ['tenant'],
        });

        return user;
    } catch (error) {
        console.error('Error verifying Firebase token:', error);
        return null;
    }
}

/**
 * Set custom claims for a Firebase user
 */
export async function setUserClaims(
    firebaseUid: string,
    claims: {
        role: UserRole;
        tenantId: string | null;
        userId: string;
    }
): Promise<void> {
    await adminAuth.setCustomUserClaims(firebaseUid, claims);
}

/**
 * Delete a Firebase user
 */
export async function deleteFirebaseUser(firebaseUid: string): Promise<void> {
    try {
        await adminAuth.deleteUser(firebaseUid);
    } catch (error) {
        console.error('Error deleting Firebase user:', error);
    }
}

/**
 * Update Firebase user password
 */
export async function updateFirebasePassword(
    firebaseUid: string,
    newPassword: string
): Promise<void> {
    await adminAuth.updateUser(firebaseUid, {
        password: newPassword,
    });
}

/**
 * Get Firebase user by email
 */
export async function getFirebaseUserByEmail(email: string) {
    try {
        return await adminAuth.getUserByEmail(email);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return null;
        }
        throw error;
    }
}
