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
        if (!user || (!user.isRegulator() && !user.isGovernmentOfficer())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { ruling, action, isExGratia } = body;

        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);
        const claim = await claimRepo.findOne({ where: { id } });

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        if (action === 'OVERTURN') {
            claim.status = ClaimStatus.APPROVED;
            claim.regulatorRuling = ruling;
            claim.isExGratia = isExGratia || false;
        } else if (action === 'UPHOLD') {
            claim.status = ClaimStatus.FINAL_REJECTION;
            claim.regulatorRuling = ruling;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await claimRepo.save(claim);

        return NextResponse.json(claim);
    } catch (error: any) {
        console.error('Error recording regulator ruling:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
