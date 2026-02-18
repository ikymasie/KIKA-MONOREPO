import { NextRequest, NextResponse } from 'next/server';
import { syncUserWithFirebase } from '@/lib/firebase-auth';
import { adminAuth } from '@/lib/firebase-admin';
import type { UserRole as UserRoleType } from '@/src/entities/User';

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { User, UserRole, UserStatus } = await import('@/src/entities/User');


        const body = await request.json();
        const { email, password, firstName, lastName, role } = body;

        // Validation
        if (!email || !password || !firstName || !lastName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Only allow applicant roles for public signup
        const allowedRoles = [UserRole.SOCIETY_APPLICANT, UserRole.COOPERATIVE_APPLICANT];
        if (!allowedRoles.includes(role as UserRoleType)) {
            return NextResponse.json({ error: 'Invalid role for registration' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepository = AppDataSource.getRepository(User);

        // Check if user already exists
        const existingUser = await userRepository.findOne({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        // Create new user in MySQL
        const newUser = userRepository.create({
            email,
            firstName,
            lastName,
            role: role as UserRoleType,
            status: UserStatus.ACTIVE,
            mfaEnabled: false,
            mustChangePassword: false,
        });

        await userRepository.save(newUser);

        // Create user in Firebase and set claims
        const firebaseUid = await syncUserWithFirebase(email, password, newUser);

        // Generate a custom token for the client to sign in
        const customToken = await adminAuth.createCustomToken(firebaseUid);

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            customToken,
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
            }
        });

    } catch (error: any) {
        console.error('Signup API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create account' },
            { status: 500 }
        );
    }
}
