import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { syncUserWithFirebase } from '@/lib/firebase-auth';
import { asyncHandler, ForbiddenError, BadRequestError } from '@/lib/errors';
import { createMember } from '@/src/db/services/MemberService';
import { getUserById } from '@/src/db/services/UserService';
import type { IMemberCreateInput } from '@/src/interfaces/IMember';
import { EmploymentStatus } from '@/src/interfaces/IMember';

export const dynamic = 'force-dynamic';
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) throw new ForbiddenError('Admin access required');
    if (!user.tenantId) throw new BadRequestError('No tenant associated with user');

    const body = await request.json();
    const {
        memberNumber,
        firstName,
        lastName,
        middleName,
        nationalId,
        dateOfBirth,
        gender,
        email,
        phone,
        employmentStatus,
        employer,
        joinDate,
        physicalAddress,
        postalAddress,
        monthlyNetSalary,
    } = body;

    if (
        !memberNumber || !firstName || !lastName || !nationalId ||
        !dateOfBirth || !gender || !email || !phone || !employmentStatus || !joinDate
    ) {
        throw new BadRequestError('Missing required fields');
    }

    const input: IMemberCreateInput = {
        tenantId: user.tenantId,
        memberNumber,
        firstName,
        lastName,
        middleName,
        nationalId,
        dateOfBirth,
        gender,
        email,
        phone,
        employmentStatus: employmentStatus as EmploymentStatus,
        employer,
        joinDate,
        physicalAddress,
        postalAddress,
        monthlyNetSalary: monthlyNetSalary ? Number(monthlyNetSalary) : 0,
    };

    const { member, userId, warning } = await createMember(input, user.tenantId);

    // Sync with Firebase (non-fatal – DB records already committed)
    try {
        const newUser = await getUserById(userId);
        if (newUser) {
            await syncUserWithFirebase(email, 'Welcome123!', newUser as any);
        }
    } catch (firebaseError) {
        console.error('Firebase sync failed during member creation:', firebaseError);
    }

    return NextResponse.json({
        success: true,
        message: 'Member and user account created successfully',
        warning,
        data: { id: member.id },
    });
});
