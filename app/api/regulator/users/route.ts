import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/lib/db';
import { User, UserRole, UserStatus } from '@/entities/User';
import { generateTemporaryPassword, hashPassword } from '@/lib/password';
import { sendEmail, generateCredentialsEmail } from '@/lib/email';

// List of regulator and government roles
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

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        // Only super regulators can manage users
        if (!user || !user.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);

        // Fetch all regulator/government users
        const users = await userRepo
            .createQueryBuilder('user')
            .where('user.role IN (:...roles)', { roles: REGULATOR_ROLES })
            .select(['user.id', 'user.email', 'user.firstName', 'user.lastName', 'user.role', 'user.status', 'user.phone'])
            .getMany();

        return NextResponse.json(users);

    } catch (error: any) {
        console.error('Error fetching regulator users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
const user = await getUserFromRequest(request);
        if (!user || !user.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email, firstName, lastName, role, phone } = await request.json();

        if (!email || !firstName || !lastName || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!REGULATOR_ROLES.includes(role)) {
            return NextResponse.json({ error: 'Invalid role for regulator user' }, { status: 400 });
        }

        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
        }

        const userRepo = AppDataSource.getRepository(User);

        // Check if user already exists
        const existing = await userRepo.findOne({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        // Generate temporary password
        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await hashPassword(temporaryPassword);

        // Create new user
        const newUser = userRepo.create({
            email,
            firstName,
            lastName,
            role,
            phone,
            status: UserStatus.ACTIVE,
            temporaryPassword: hashedPassword,
            mustChangePassword: true,
        });

        await userRepo.save(newUser);

        // Send credentials email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const loginUrl = `${baseUrl}/signin`;

        const emailContent = generateCredentialsEmail({
            recipientName: newUser.fullName,
            email: newUser.email,
            temporaryPassword,
            loginUrl
        });

        await sendEmail({
            to: newUser.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
        });

        console.log(`✅ User created and credentials sent to ${newUser.email}`);

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role
            }
        });

    } catch (error: any) {
        console.error('Error creating regulator user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
