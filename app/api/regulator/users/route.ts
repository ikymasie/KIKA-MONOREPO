import { NextRequest, NextResponse } from 'next/server';
import { generateTemporaryPassword, hashPassword } from '@/lib/password';
import { sendEmail, generateCredentialsEmail } from '@/lib/email';
import { query, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
const REGULATOR_ROLES = [
    'dcd_director',
    'dcd_field_officer',
    'dcd_compliance_officer',
    'bob_prudential_supervisor',
    'bob_financial_auditor',
    'bob_compliance_officer',
    'deduction_officer',
    'registry_clerk',
    'intelligence_liaison',
    'legal_officer',
    'registrar',
    'director_cooperatives',
    'minister_delegate',
];

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("../../../../lib/auth-server");
        const user = await getUserFromRequest(request);
        // Only super regulators can manage users
        if (!user || !user.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const placeholders = REGULATOR_ROLES.map(() => '?').join(',');
        const users = await query(
            `SELECT id, email, firstName, lastName, role, status, phone FROM users WHERE role IN (${placeholders})`,
            REGULATOR_ROLES
        ) as any[];

        return NextResponse.json(users);

    } catch (error: any) {
        console.error('Error fetching regulator users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("../../../../lib/auth-server");
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

        // Check if user already exists
        const existingUsers = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]) as any[];
        if (existingUsers.length > 0) {
            return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
        }

        // Generate temporary password
        const temporaryPassword = generateTemporaryPassword();
        const hashedPassword = await hashPassword(temporaryPassword);

        // Create new user
        const newUserId = uuidv4();
        await execute(
            `INSERT INTO users (id, email, firstName, lastName, role, phone, status, temporaryPassword, mustChangePassword, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [newUserId, email, firstName, lastName, role, phone || null, 'active', hashedPassword]
        );

        const newUser = {
            id: newUserId,
            email,
            firstName,
            lastName,
            role,
            phone,
            fullName: `${firstName} ${lastName}`
        };

        // Send credentials email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const loginUrl = `${baseUrl}/signin`;

        const emailContent = generateCredentialsEmail({
            recipientName: newUser.fullName,
            email: newUser.email || '',
            temporaryPassword,
            loginUrl
        });

        await sendEmail({
            to: newUser.email || '',
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
        });

        console.log(`✅ Sent welcome email to ${newUser.email || 'unknown'}`);

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
