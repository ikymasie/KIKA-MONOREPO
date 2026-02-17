import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { InsuranceClaim, ClaimStatus } from '@/src/entities/InsuranceClaim';
import { InsurancePolicy } from '@/src/entities/InsurancePolicy';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError, NotFoundError } from '@/lib/errors';

async function initDB() {
    if (!AppDataSource.isInitialized) {
        try {
            await AppDataSource.initialize();
        } catch (error) {
            throw new DatabaseError('Failed to initialize database connection');
        }
    }
}

// POST: Submit a claim on behalf of a member
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');

    await initDB();

    const body = await request.json();
    const { policyId, claimType, claimAmount, incidentDate, description, supportingDocuments } = body;

    if (!policyId || !claimType || !claimAmount || !incidentDate || !description) {
        throw new BadRequestError('Missing required fields');
    }

    if (!user.tenantId) throw new BadRequestError('User tenant ID not found');

    const policyRepo = AppDataSource.getRepository(InsurancePolicy);
    const policy = await policyRepo.findOne({
        where: { id: policyId },
        relations: ['member']
    });

    if (!policy || policy.member.tenantId !== user.tenantId) {
        throw new NotFoundError('Policy not found');
    }

    const claimRepo = AppDataSource.getRepository(InsuranceClaim);

    // Generate claim number (simplified)
    const count = await claimRepo.count({ where: { tenantId: user.tenantId } });
    const claimNumber = `CLM-${user.tenantId.substring(0, 4).toUpperCase()}-${(count + 1).toString().padStart(6, '0')}`;

    const claim = claimRepo.create({
        tenantId: user.tenantId,
        claimNumber,
        policyId,
        claimType,
        claimAmount: Number(claimAmount),
        incidentDate: new Date(incidentDate),
        description,
        supportingDocuments,
        status: ClaimStatus.SUBMITTED
    });

    await claimRepo.save(claim);

    return NextResponse.json({
        success: true,
        message: 'Claim submitted successfully',
        data: claim
    });
});

// GET: Fetch claim assistance history for a member
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');

    await initDB();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) throw new BadRequestError('Member ID is required');

    const claimRepo = AppDataSource.getRepository(InsuranceClaim);
    const claims = await claimRepo.find({
        where: {
            tenantId: user.tenantId,
            policy: { memberId }
        },
        relations: ['policy', 'policy.product'],
        order: { createdAt: 'DESC' }
    });

    return NextResponse.json({
        success: true,
        data: claims
    });
});
