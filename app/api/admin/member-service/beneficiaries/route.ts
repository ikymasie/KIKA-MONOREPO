import { NextRequest, NextResponse } from 'next/server';
import { query, execute, buildSetClause } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from '@/lib/errors';

// POST: Add a new beneficiary
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');

    const body = await request.json();
    const { memberId, firstName, lastName, relationship, dateOfBirth, nationalId, phone, address, allocationPercentage } = body;

    if (!memberId || !firstName || !lastName || !relationship || !dateOfBirth || !nationalId || allocationPercentage === undefined) {
        throw new BadRequestError('Missing required fields');
    }

    const [[member]] = await query('SELECT id FROM members WHERE id = ? AND tenantId = ? LIMIT 1', [memberId, user.tenantId]) as any;
    if (!member) throw new NotFoundError('Member not found');

    // Check total allocation percentage
    const existingBeneficiaries = await query('SELECT allocationPercentage FROM beneficiaries WHERE memberId = ?', [memberId]) as any[];
    const currentTotal = existingBeneficiaries.reduce((sum, b) => sum + Number(b.allocationPercentage), 0);
    if (currentTotal + Number(allocationPercentage) > 100) {
        throw new BadRequestError(`Total allocation cannot exceed 100%. Current: ${currentTotal}%`);
    }

    const newBeneficiaryId = uuidv4();
    await execute(
        `INSERT INTO beneficiaries (id, memberId, firstName, lastName, relationship, dateOfBirth, nationalId, phone, address, allocationPercentage, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [newBeneficiaryId, memberId, firstName, lastName, relationship, new Date(dateOfBirth), nationalId, phone || null, address || null, Number(allocationPercentage)]
    );

    const [[beneficiary]] = await query('SELECT * FROM beneficiaries WHERE id = ? LIMIT 1', [newBeneficiaryId]) as any;

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

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) throw new BadRequestError('Beneficiary ID is required');

    const [[beneficiary]] = await query('SELECT b.*, m.tenantId FROM beneficiaries b JOIN members m ON m.id = b.memberId WHERE b.id = ? LIMIT 1', [id]) as any;

    if (!beneficiary) throw new NotFoundError('Beneficiary not found');
    if (beneficiary.tenantId !== user.tenantId) throw new ForbiddenError('Access denied');

    // If updating allocation, check total
    if (updates.allocationPercentage !== undefined) {
        const otherBeneficiaries = await query('SELECT id, allocationPercentage FROM beneficiaries WHERE memberId = ?', [beneficiary.memberId]) as any[];
        const currentTotal = otherBeneficiaries
            .filter((b: any) => b.id !== id)
            .reduce((sum: number, b: any) => sum + Number(b.allocationPercentage), 0);

        if (currentTotal + Number(updates.allocationPercentage) > 100) {
            throw new BadRequestError(`Total allocation cannot exceed 100%. Other: ${currentTotal}%`);
        }
    }

    if (updates.dateOfBirth) updates.dateOfBirth = new Date(updates.dateOfBirth);

    if (Object.keys(updates).length > 0) {
        const { clause, values } = buildSetClause(updates);
        await execute(`UPDATE beneficiaries SET ${clause}, updatedAt = NOW() WHERE id = ?`, [...values, id]);
    }

    const [[updatedBeneficiary]] = await query('SELECT * FROM beneficiaries WHERE id = ? LIMIT 1', [id]) as any;

    return NextResponse.json({
        success: true,
        message: 'Beneficiary updated successfully',
        data: updatedBeneficiary
    });
});

// DELETE: Remove a beneficiary
export const DELETE = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) throw new BadRequestError('Beneficiary ID is required');

    const [[beneficiary]] = await query('SELECT b.*, m.tenantId FROM beneficiaries b JOIN members m ON m.id = b.memberId WHERE b.id = ? LIMIT 1', [id]) as any;

    if (!beneficiary) throw new NotFoundError('Beneficiary not found');
    if (beneficiary.tenantId !== user.tenantId) throw new ForbiddenError('Access denied');

    await execute('DELETE FROM beneficiaries WHERE id = ?', [id]);

    return NextResponse.json({
        success: true,
        message: 'Beneficiary removed successfully'
    });
});
