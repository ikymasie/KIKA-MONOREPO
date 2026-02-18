import { NextRequest, NextResponse } from 'next/server';
import { syncUserWithFirebase } from '@/lib/firebase-auth';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { AppDataSource } = await import('@/src/config/database');
        const { User, UserRole, UserStatus } = await import('@/src/entities/User');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || user.role !== UserRole.SACCOS_ADMIN) {
            return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 401 });
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepository = AppDataSource.getRepository(User);
        const users = await userRepository.find({
            where: { tenantId: user.tenantId },
            order: { createdAt: 'DESC' }
        });

        const formattedUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            fullName: u.fullName,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt,
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (error: any) {
        console.error('List Users API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { AppDataSource } = await import('@/src/config/database');
        const { User, UserRole, UserStatus } = await import('@/src/entities/User');

        const currentUser = await getUserFromRequest(request);
        if (!currentUser || currentUser.role !== UserRole.SACCOS_ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!currentUser.tenantId) {
            return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
        }

        const body = await request.json();
        const { email, firstName, lastName, role, password } = body;

        if (!email || !firstName || !lastName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Only allow SACCOS staff roles to be created
        const allowedRoles = [
            UserRole.LOAN_OFFICER,
            UserRole.ACCOUNTANT,
            UserRole.MEMBER_SERVICE_REP,
            UserRole.CREDIT_COMMITTEE,
        ];

        if (!allowedRoles.includes(role as any)) {
            return NextResponse.json({ error: 'Invalid role for organization staff' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepository = AppDataSource.getRepository(User);

        // Check if user already exists
        const existingUser = await userRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        function getDefaultPermissions(role: any): Record<string, boolean> {
            switch (role) {
                case UserRole.SACCOS_ADMIN:
                    return {
                        'system:manage': false,
                        'users:manage': true,
                        'members:manage': true,
                        'loans:manage': true,
                        'savings:manage': true,
                        'reports:view': true,
                        'settings:manage': true,
                    };
                case UserRole.LOAN_OFFICER:
                    return {
                        'members:view': true,
                        'loans:manage': true,
                        'guarantors:manage': true,
                    };
                case UserRole.ACCOUNTANT:
                    return {
                        'finance:manage': true,
                        'gl:manage': true,
                        'payments:manage': true,
                        'reports:view': true,
                    };
                case UserRole.MEMBER_SERVICE_REP:
                    return {
                        'members:manage': true,
                        'kyc:update': true,
                        'insurance_claims:initiate': true,
                    };
                case UserRole.CREDIT_COMMITTEE:
                    return {
                        'loans:view': true,
                        'loans:approve': true,
                    };
                default:
                    return {};
            }
        }

        // Create new user
        const newUser = userRepository.create({
            email,
            firstName,
            lastName,
            role: role as any,
            tenantId: currentUser.tenantId,
            status: UserStatus.ACTIVE,
            mfaEnabled: false,
            permissions: getDefaultPermissions(role),
        });

        await userRepository.save(newUser);

        // Sync with Firebase
        // Default password for new staff if not provided (should be changed on first login)
        const staffPassword = password || 'Welcome123!';
        await syncUserWithFirebase(email, staffPassword, newUser);

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
            }
        });

    } catch (error: any) {
        console.error('Create User API error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 500 }
        );
    }
}
