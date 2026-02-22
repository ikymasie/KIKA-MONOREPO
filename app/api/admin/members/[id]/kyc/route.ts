import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { KYC } from '@/src/entities/KYC';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/members/[id]/kyc
 * Fetch KYC details for a specific member
 */
export const GET = asyncHandler(async (
    request: NextRequest,
    { params }: { params: { id: string } }
) => {
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

    if (!user.isTenantAdmin()) {
        throw new ForbiddenError('Admin access required');
    }

    if (!user.tenantId) {
        throw new BadRequestError('No tenant associated with user');
    }

    const { id } = params;

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const kycRepo = AppDataSource.getRepository(KYC);
    const memberRepo = AppDataSource.getRepository(Member);

    // Verify member belongs to tenant
    const member = await memberRepo.findOne({
        where: { id, tenantId: user.tenantId }
    });

    if (!member) {
        throw new NotFoundError('Member not found');
    }

    const kyc = await kycRepo.findOne({
        where: { memberId: id }
    });

    // Valid to return null if no KYC record exists yet
    return NextResponse.json({
        success: true,
        data: kyc
    });
});

/**
 * PATCH /api/admin/members/[id]/kyc
 * Update KYC verification status and document details
 */
export const PATCH = asyncHandler(async (
    request: NextRequest,
    { params }: { params: { id: string } }
) => {
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

    if (!user.isTenantAdmin()) {
        throw new ForbiddenError('Admin access required');
    }

    const { id } = params;
    const body = await request.json();

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const kycRepo = AppDataSource.getRepository(KYC);
    const memberRepo = AppDataSource.getRepository(Member);

    // Verify member exists and belongs to tenant
    const member = await memberRepo.findOne({
        where: { id, tenantId: user.tenantId }
    });

    if (!member) {
        throw new NotFoundError('Member not found');
    }

    let kyc = await kycRepo.findOne({
        where: { memberId: id }
    });

    if (!kyc) {
        // Create new KYC record if it doesn't exist
        kyc = kycRepo.create({
            memberId: id
        });
    }

    // Update fields allowed in body
    // Using explicit assignment to avoid prototype pollution
    const allowedFields = [
        'omangNumber', 'omangExpiryDate',
        'passportNumber', 'passportExpiryDate',
        'workPermitNumber', 'workPermitExpiryDate',
        'residencePermitNumber', 'residencePermitExpiryDate',
        'birthCertificateNumber',
        'residenceProofType', 'residenceDocumentDate',
        'incomeSourceType',
        'isPip', 'pipPosition', 'pipDeclarationDate',
        'notes',
        // URLs would typically be updated here too if passed
        'omangFrontUrl', 'omangBackUrl', 'passportUrl',
        'workPermitUrl', 'residencePermitUrl', 'birthCertificateUrl',
        'guardianOmangUrl', 'proofOfResidenceUrl', 'proofOfIncomeUrl',
        'sourceOfFundsAffidavitUrl'
    ];

    allowedFields.forEach(field => {
        if (body[field] !== undefined) {
            (kyc as any)[field] = body[field];
        }
    });

    // Handle Verification Status Updates
    const now = new Date();

    if (body.identityVerified !== undefined) {
        kyc.identityVerified = body.identityVerified;
        if (body.identityVerified) {
            kyc.identityVerifiedBy = user.id;
            kyc.identityVerifiedAt = now;
        } else {
            kyc.identityVerifiedBy = undefined;
            kyc.identityVerifiedAt = undefined;
        }
    }

    if (body.residenceVerified !== undefined) {
        kyc.residenceVerified = body.residenceVerified;
        if (body.residenceVerified) {
            kyc.residenceVerifiedBy = user.id;
            kyc.residenceVerifiedAt = now;
        } else {
            kyc.residenceVerifiedBy = undefined;
            kyc.residenceVerifiedAt = undefined;
        }
    }

    if (body.incomeVerified !== undefined) {
        kyc.incomeVerified = body.incomeVerified;
        if (body.incomeVerified) {
            kyc.incomeVerifiedBy = user.id;
            kyc.incomeVerifiedAt = now;
        } else {
            kyc.incomeVerifiedBy = undefined;
            kyc.incomeVerifiedAt = undefined;
        }
    }

    if (body.pipVerified !== undefined) {
        kyc.pipVerified = body.pipVerified;
        if (body.pipVerified) {
            kyc.pipVerifiedBy = user.id;
            kyc.pipVerifiedAt = now;
        } else {
            kyc.pipVerifiedBy = undefined;
            kyc.pipVerifiedAt = undefined;
        }
    }

    await kycRepo.save(kyc);

    return NextResponse.json({
        success: true,
        data: kyc
    });
});
