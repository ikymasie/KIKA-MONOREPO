import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { InsuranceClaim, ClaimStatus } = await import('@/src/entities/InsuranceClaim');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { disputeReason, disputeEvidenceUrls } = body;

        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);
        const claim = await claimRepo.findOne({
            where: { id, policy: { memberId: user.id } },
            relations: ['policy']
        });

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found or access denied' }, { status: 404 });
        }

        if (claim.status !== ClaimStatus.REJECTED && claim.status !== ClaimStatus.APPEAL_DECLINED) {
            return NextResponse.json({ error: 'Only rejected or declined claims can be appealed' }, { status: 400 });
        }

        // Checklist for 30-day appeal window could be added here if incident date is available

        claim.status = ClaimStatus.UNDER_APPEAL;
        claim.disputeReason = disputeReason;
        claim.disputeEvidenceUrls = disputeEvidenceUrls;

        await claimRepo.save(claim);

        return NextResponse.json(claim);
    } catch (error: any) {
        console.error('Error lodging dispute:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
