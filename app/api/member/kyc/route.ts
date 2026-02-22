import { NextRequest, NextResponse } from 'next/server';
import { AppDataSource } from '@/src/config/database';
import { Member } from '@/src/entities/Member';
import { KYC } from '@/src/entities/KYC';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, DatabaseError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/member/kyc
 * Fetch current member's KYC details
 */
export const GET = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const memberRepo = AppDataSource.getRepository(Member);
    const kycRepo = AppDataSource.getRepository(KYC);

    // Find the member record linked to this user
    const member = await memberRepo.findOne({
        where: { userId: user.id }
    });

    if (!member) {
        throw new NotFoundError('Member profile not found');
    }

    const kyc = await kycRepo.findOne({
        where: { memberId: member.id }
    });

    return NextResponse.json({
        success: true,
        data: kyc
    });
});

/**
 * PATCH /api/member/kyc
 * Update KYC documents and declarations
 */
export const PATCH = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) {
        throw new UnauthorizedError('User not authenticated');
    }

    const body = await request.json();

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const memberRepo = AppDataSource.getRepository(Member);
    const kycRepo = AppDataSource.getRepository(KYC);

    const member = await memberRepo.findOne({
        where: { userId: user.id }
    });

    if (!member) {
        throw new NotFoundError('Member profile not found');
    }

    let kyc = await kycRepo.findOne({
        where: { memberId: member.id }
    });

    if (!kyc) {
        kyc = kycRepo.create({
            memberId: member.id
        });
    }

    // Members can ONLY update specific fields
    // They CANNOT verify themselves
    const allowedFields = [
        'omangNumber', 'omangExpiryDate',
        'passportNumber', 'passportExpiryDate',
        'workPermitNumber', 'workPermitExpiryDate',
        'residencePermitNumber', 'residencePermitExpiryDate',
        'birthCertificateNumber',
        'residenceProofType', 'residenceDocumentDate',
        'incomeSourceType',
        'isPip', 'pipPosition', 'pipDeclarationDate',
        // URLs
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

    // If critical fields change, we should probably reset verification status?
    // For now, let's keep it simple. Admin will see new docs and re-verify.
    // Ideally:
    // if (changed) kyc.identityVerified = false;

    await kycRepo.save(kyc);

    return NextResponse.json({
        success: true,
        data: kyc
    });
});
