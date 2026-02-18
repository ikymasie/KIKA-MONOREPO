import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member, MemberStatus, EmploymentStatus } from '@/src/entities/Member';
import { User, UserRole, UserStatus } from '@/src/entities/User';
import { getUserFromRequest } from '@/lib/auth-server';
import { syncUserWithFirebase } from '@/lib/firebase-auth';
import { asyncHandler, ForbiddenError, BadRequestError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const POST = asyncHandler(async (request: NextRequest) => {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user || !user.isTenantAdmin()) {
        throw new ForbiddenError('Admin access required');
    }

    if (!user.tenantId) {
        throw new BadRequestError('No tenant associated with user');
    }

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
        monthlyNetSalary
    } = body;

    // Validate required fields
    if (!memberNumber || !firstName || !lastName || !nationalId || !dateOfBirth || !gender || !email || !phone || !employmentStatus || !joinDate) {
        throw new BadRequestError('Missing required fields');
    }

    // Initialize database connection
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    return await AppDataSource.transaction(async (transactionalEntityManager) => {
        const memberRepo = transactionalEntityManager.getRepository(Member);
        const userRepo = transactionalEntityManager.getRepository(User);

        // Check if member number or ID already exists in this tenant
        const existingMember = await memberRepo.findOne({
            where: [
                { memberNumber, tenantId: user.tenantId },
                { nationalId, tenantId: user.tenantId }
            ]
        });

        if (existingMember) {
            throw new BadRequestError('Member with this Member Number or National ID already exists in your organization');
        }

        // Check if National ID exists in OTHER tenants (Warning only)
        const otherTenantMember = await memberRepo.findOne({
            where: { nationalId },
            relations: ['tenant']
        });

        let warning = null;
        if (otherTenantMember && otherTenantMember.tenantId !== user.tenantId) {
            warning = `Applicant is already an active member of ${otherTenantMember.tenant.name}. Written consent from the Director for Co-operative Development is required for dual membership.`;
        }

        // Check if email or phone is already used in User table globally
        const existingEmailUser = await userRepo.findOne({ where: { email } });
        if (existingEmailUser) {
            throw new BadRequestError('A user with this email already exists');
        }

        const existingPhoneUser = await userRepo.findOne({ where: { phone } });
        if (existingPhoneUser) {
            throw new BadRequestError('A user with this phone number already exists');
        }

        // Create user account for the member
        const newUser = userRepo.create({
            email,
            phone,
            firstName,
            lastName,
            role: UserRole.MEMBER,
            tenantId: user.tenantId,
            status: UserStatus.ACTIVE,
            mfaEnabled: false,
            permissions: {}
        });

        await transactionalEntityManager.save(newUser);

        // Create the member record
        const newMember = memberRepo.create({
            memberNumber,
            firstName,
            lastName,
            middleName,
            nationalId,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            email,
            phone,
            employmentStatus: employmentStatus as EmploymentStatus,
            employer,
            joinDate: new Date(joinDate),
            physicalAddress,
            postalAddress,
            tenantId: user.tenantId,
            userId: newUser.id,
            status: MemberStatus.ACTIVE,
            shareCapital: 0,
            monthlyNetSalary: monthlyNetSalary ? Number(monthlyNetSalary) : 0
        });

        await transactionalEntityManager.save(newMember);

        // Sync with Firebase (default password)
        try {
            await syncUserWithFirebase(email, 'Welcome123!', newUser);
        } catch (firebaseError) {
            console.error('Firebase sync failed during member creation:', firebaseError);
            // We don't roll back the DB transaction because the DB records are created,
            // but we might want to flag this for retry or let the admin know.
        }

        return NextResponse.json({
            success: true,
            message: 'Member and user account created successfully',
            warning,
            data: { id: newMember.id }
        });
    });
});
