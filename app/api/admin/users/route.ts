import { NextRequest, NextResponse } from 'next/server';
import { syncUserWithFirebase } from '@/lib/firebase-auth';
import {
    listUsersByTenant,
    createUser,
    emailExists,
    UserRole,
    UserStatus,
    getDefaultPermissions,
} from '@/src/db/services/UserService';
import type { IUserCreateInput } from '@/src/interfaces/IUser';
import { CREATABLE_STAFF_ROLES } from '@/src/interfaces/IUser';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const user = await getUserFromRequest(request);
        if (!user || user.role !== ('saccos_admin' as UserRole)) {
            return NextResponse.json({ error: 'Unauthorized or insufficient permissions' }, { status: 401 });
        }

        if (!user.tenantId) {
            return NextResponse.json({ error: 'No tenant associated with user' }, { status: 400 });
        }

        const users = await listUsersByTenant(user.tenantId);

        const formattedUsers = users.map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            fullName: `${u.firstName} ${u.lastName}`,
            role: u.role,
            status: u.status,
            createdAt: u.createdAt,
        }));

        return NextResponse.json({ users: formattedUsers });
    } catch (error: any) {
        console.error('List Users API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { getUserFromRequest } = await import('@/lib/auth-server');

        const currentUser = await getUserFromRequest(request);
        if (!currentUser || currentUser.role !== ('saccos_admin' as UserRole)) {
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
        if (!CREATABLE_STAFF_ROLES.includes(role as UserRole)) {
            return NextResponse.json({ error: 'Invalid role for organisation staff' }, { status: 400 });
        }

        if (await emailExists(email)) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
        }

        const input: IUserCreateInput = {
            email,
            firstName,
            lastName,
            role: role as UserRole,
            tenantId: currentUser.tenantId,
            status: UserStatus.ACTIVE,
            mfaEnabled: false,
            permissions: getDefaultPermissions(role as UserRole),
        };

        const newUser = await createUser(input);

        // Sync with Firebase
        const staffPassword = password || 'Welcome123!';
        await syncUserWithFirebase(email, staffPassword, newUser as any);

        return NextResponse.json({
            message: 'User created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
            },
        });
    } catch (error: any) {
        console.error('Create User API error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }
}
