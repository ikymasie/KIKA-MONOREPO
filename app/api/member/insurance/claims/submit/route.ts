import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { InsuranceClaim, ClaimStatus } from '@/src/entities/InsuranceClaim';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);

        const claimCount = await claimRepo.count();
        const claimNumber = `CLM-${new Date().getFullYear()}-${String(claimCount + 1).padStart(5, '0')}`;

        const claim = claimRepo.create({
            ...body,
            tenantId: user.tenantId,
            claimNumber,
            status: ClaimStatus.SUBMITTED
        });

        await claimRepo.save(claim);
        return NextResponse.json(claim);
    } catch (error: any) {
        console.error('Error submitting insurance claim:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
