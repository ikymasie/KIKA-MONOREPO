import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { User, UserRole } from '@/entities/User';
import { getUserFromRequest } from '@/lib/auth-server';

const REGULATOR_ROLES = [
    UserRole.DCD_DIRECTOR,
    UserRole.DCD_FIELD_OFFICER,
    UserRole.DCD_COMPLIANCE_OFFICER,
    UserRole.BOB_PRUDENTIAL_SUPERVISOR,
    UserRole.BOB_FINANCIAL_AUDITOR,
    UserRole.BOB_COMPLIANCE_OFFICER,
    UserRole.DEDUCTION_OFFICER,
    UserRole.REGISTRY_CLERK,
    UserRole.INTELLIGENCE_LIAISON,
    UserRole.LEGAL_OFFICER,
    UserRole.REGISTRAR,
    UserRole.DIRECTOR_COOPERATIVES,
    UserRole.MINISTER_DELEGATE,
];

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || !currentUser.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({
            where: { id: params.id },
            select: ['id', 'email', 'firstName', 'lastName', 'role', 'status', 'phone']
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);

    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || !currentUser.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { firstName, lastName, phone, role } = await request.json();

        if (!firstName || !lastName) {
            return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
        }

        if (role && !REGULATOR_ROLES.includes(role)) {
            return NextResponse.json({ error: 'Invalid role for regulator user' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);
        const user = await userRepo.findOne({ where: { id: params.id } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update user details
        user.firstName = firstName;
        user.lastName = lastName;
        if (phone !== undefined) user.phone = phone;
        if (role) user.role = role;

        await userRepo.save(user);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                phone: user.phone,
                status: user.status
            }
        });

    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
