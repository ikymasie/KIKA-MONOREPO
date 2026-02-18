import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Beneficiary } from '@/src/entities/Beneficiary';
import { Member } from '@/src/entities/Member';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';
// Helper to initialize database
async function initDB() {
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }
}

// POST: Add a new beneficiary
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');

    await initDB();

    const body = await request.json();
    const { memberId, firstName, lastName, relationship, dateOfBirth, nationalId, phone, address, allocationPercentage } = body;

    if (!memberId || !firstName || !lastName || !relationship || !dateOfBirth || !nationalId || allocationPercentage === undefined) {
        throw new BadRequestError('Missing required fields');
    }

    const memberRepo = AppDataSource.getRepository(Member);
    const member = await memberRepo.findOne({ where: { id: memberId, tenantId: user.tenantId } });
    if (!member) throw new NotFoundError('Member not found');

    const beneficiaryRepo = AppDataSource.getRepository(Beneficiary);

    // Check total allocation percentage
    const existingBeneficiaries = await beneficiaryRepo.find({ where: { memberId } });
    const currentTotal = existingBeneficiaries.reduce((sum, b) => sum + Number(b.allocationPercentage), 0);
    if (currentTotal + Number(allocationPercentage) > 100) {
        throw new BadRequestError(`Total allocation cannot exceed 100%. Current: ${currentTotal}%`);
    }

    const beneficiary = beneficiaryRepo.create({
        memberId,
        firstName,
        lastName,
        relationship,
        dateOfBirth: new Date(dateOfBirth),
        nationalId,
        phone,
        address,
        allocationPercentage: Number(allocationPercentage)
    });

    await beneficiaryRepo.save(beneficiary);

    return NextResponse.json({
        success: true,
        message: 'Beneficiary added successfully',
        data: beneficiary
    });
});

// PATCH: Update a beneficiary
export const PATCH = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');

    await initDB();

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) throw new BadRequestError('Beneficiary ID is required');

    const beneficiaryRepo = AppDataSource.getRepository(Beneficiary);
    const beneficiary = await beneficiaryRepo.findOne({
        where: { id },
        relations: ['member']
    });

    if (!beneficiary) throw new NotFoundError('Beneficiary not found');
    if (beneficiary.member.tenantId !== user.tenantId) throw new ForbiddenError('Access denied');

    // If updating allocation, check total
    if (updates.allocationPercentage !== undefined) {
        const otherBeneficiaries = await beneficiaryRepo.find({
            where: { memberId: beneficiary.memberId }
        });
        const currentTotal = otherBeneficiaries
            .filter(b => b.id !== id)
            .reduce((sum, b) => sum + Number(b.allocationPercentage), 0);

        if (currentTotal + Number(updates.allocationPercentage) > 100) {
            throw new BadRequestError(`Total allocation cannot exceed 100%. Other: ${currentTotal}%`);
        }
    }

    Object.assign(beneficiary, updates);
    if (updates.dateOfBirth) beneficiary.dateOfBirth = new Date(updates.dateOfBirth);

    await beneficiaryRepo.save(beneficiary);

    return NextResponse.json({
        success: true,
        message: 'Beneficiary updated successfully',
        data: beneficiary
    });
});

// DELETE: Remove a beneficiary
export const DELETE = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');

    await initDB();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) throw new BadRequestError('Beneficiary ID is required');

    const beneficiaryRepo = AppDataSource.getRepository(Beneficiary);
    const beneficiary = await beneficiaryRepo.findOne({
        where: { id },
        relations: ['member']
    });

    if (!beneficiary) throw new NotFoundError('Beneficiary not found');
    if (beneficiary.member.tenantId !== user.tenantId) throw new ForbiddenError('Access denied');

    await beneficiaryRepo.remove(beneficiary);

    return NextResponse.json({
        success: true,
        message: 'Beneficiary removed successfully'
    });
});
