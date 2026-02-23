import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/src/db/query';
import { v4 as uuidv4 } from 'uuid';
import { getUserFromRequest } from '@/lib/auth-server';
import { asyncHandler, UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from '@/lib/errors';

// POST: Submit a claim on behalf of a member
export const POST = asyncHandler(async (request: NextRequest) => {
    const user = await getUserFromRequest(request);
    if (!user) throw new UnauthorizedError('User not authenticated');
    if (!user.isTenantAdmin()) throw new ForbiddenError('Admin access required');

    const body = await request.json();
    const { policyId, claimType, claimAmount, incidentDate, description, supportingDocuments } = body;

    if (!policyId || !claimType || !claimAmount || !incidentDate || !description) {
        throw new BadRequestError('Missing required fields');
    }

    if (!user.tenantId) throw new BadRequestError('User tenant ID not found');

    const [[policy]] = await query('SELECT p.id, m.tenantId FROM insurance_policies p JOIN members m ON m.id = p.memberId WHERE p.id = ? LIMIT 1', [policyId]) as any;

    if (!policy || policy.tenantId !== user.tenantId) {
        throw new NotFoundError('Policy not found');
    }

    // Generate claim number (simplified)
    const [[{ count }]] = await query('SELECT COUNT(*) as count FROM insurance_claims WHERE tenantId = ?', [user.tenantId]) as any;
    const claimNumber = `CLM-${user.tenantId.substring(0, 4).toUpperCase()}-${(Number(count) + 1).toString().padStart(6, '0')}`;

    const claimId = uuidv4();
    const claimData = {
        id: claimId,
        tenantId: user.tenantId,
        claimNumber,
        policyId,
        claimType,
        claimAmount: Number(claimAmount),
        incidentDate: new Date(incidentDate),
        description,
        supportingDocuments: supportingDocuments ? JSON.stringify(supportingDocuments) : '[]',
        status: 'submitted'
    };

    await execute(
        `INSERT INTO insurance_claims (id, tenantId, claimNumber, policyId, claimType, claimAmount, incidentDate, description, supportingDocuments, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [claimData.id, claimData.tenantId, claimData.claimNumber, claimData.policyId, claimData.claimType, claimData.claimAmount, claimData.incidentDate, claimData.description, claimData.supportingDocuments, claimData.status]
    );

    const [[claim]] = await query('SELECT * FROM insurance_claims WHERE id = ? LIMIT 1', [claimId]) as any;

    // Parse json columns back to array
    if (claim.supportingDocuments && typeof claim.supportingDocuments === 'string') {
        claim.supportingDocuments = JSON.parse(claim.supportingDocuments);
    }

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

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) throw new BadRequestError('Member ID is required');

    const claims = await query(
        `SELECT c.*, p.productName as policyProductName 
         FROM insurance_claims c 
         JOIN insurance_policies p ON p.id = c.policyId 
         WHERE c.tenantId = ? AND p.memberId = ? 
         ORDER BY c.createdAt DESC`,
        [user.tenantId, memberId]
    ) as any[];

    // Parse supportingDocuments
    const parsedClaims = claims.map((c: any) => {
        if (c.supportingDocuments && typeof c.supportingDocuments === 'string') {
            try {
                c.supportingDocuments = JSON.parse(c.supportingDocuments);
            } catch (e) {
                // Ignore parse errors
            }
        }
        return c;
    });

    return NextResponse.json({
        success: true,
        data: parsedClaims
    });
});
