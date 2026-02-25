import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
// Need to access UserRole for this constant, but it's used inside function or moved inside
// Moving REGULATOR_ROLES inside PUT or verify where needed, or using dynamic import if top level needed (but cannot await top level easily)
// Actually, UserRole is enum. Importing it dynamically is tricky for top level constants.
// For now, I will move REGULATOR_ROLES inside the function or just import UserRole dynamically inside function and define array there.

// Removing top level definition and moving inside function



export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { query } = await import("@/src/db/query");
        const { getUserFromRequest } = await import("@/lib/auth-server");
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || !currentUser.isRegulator()) {
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await query(
            'SELECT id, email, firstName, lastName, role, status, phone FROM users WHERE id = ? LIMIT 1',
            [params.id]
        ) as any[];
        const user = users[0];

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
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import("@/lib/auth-server");
        const currentUser = await getUserFromRequest(request);
        if (!currentUser || !currentUser.isRegulator()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { firstName, lastName, phone, role } = await request.json();

        if (!firstName || !lastName) {
            return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
        }

        const { query, execute } = await import("@/src/db/query");

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

        if (role && !REGULATOR_ROLES.includes(role)) {
            return NextResponse.json({ error: 'Invalid role for regulator user' }, { status: 400 });
        }

        const users = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [params.id]) as any[];
        const user = users[0];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update user details
        const updateParams: any[] = [firstName, lastName];
        let sql = 'UPDATE users SET firstName = ?, lastName = ?';

        if (phone !== undefined) {
            sql += ', phone = ?';
            updateParams.push(phone);
            user.phone = phone;
        }
        if (role) {
            sql += ', role = ?';
            updateParams.push(role);
            user.role = role;
        }

        sql += ', updatedAt = NOW() WHERE id = ?';
        updateParams.push(params.id);

        await execute(sql, updateParams);
        user.firstName = firstName;
        user.lastName = lastName;

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
