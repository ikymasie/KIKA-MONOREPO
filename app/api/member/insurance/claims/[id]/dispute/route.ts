import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getClaim, updateClaim } from '@/src/db/services/InsuranceService';
import { ClaimStatus } from '@/src/interfaces/IInsurance';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;
        const { disputeReason, disputeEvidenceUrls } = await request.json();

        const claim = await getClaim(id, user.tenantId);
        // Verify claim exists and belongs to member's policy
        const { queryOne } = await import("../../../../../../../src/db/query");
        const policyCheck = await queryOne('SELECT id FROM insurance_policies WHERE id = ? AND memberId = ? LIMIT 1', [claim?.policyId, user.id]);

        if (!claim || !policyCheck) return NextResponse.json({ error: 'Claim not found or access denied' }, { status: 404 });

        if (claim.status !== ClaimStatus.REJECTED && claim.status !== ClaimStatus.APPEAL_DECLINED) {
            return NextResponse.json({ error: 'Only rejected or declined claims can be appealed' }, { status: 400 });
        }

        const updatedClaim = await updateClaim(id, user.tenantId, {
            status: ClaimStatus.UNDER_APPEAL,
            disputeReason,
            disputeEvidenceUrls
        });

        return NextResponse.json(updatedClaim);
    } catch (error: any) {
        console.error('Error lodging dispute:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
