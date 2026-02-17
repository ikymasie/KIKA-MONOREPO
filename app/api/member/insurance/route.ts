import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { InsurancePolicy } from '@/src/entities/InsurancePolicy';
import { InsuranceClaim, ClaimStatus } from '@/src/entities/InsuranceClaim';
import { InsuranceProduct } from '@/src/entities/InsuranceProduct';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const policyRepo = db.getRepository(InsurancePolicy);
        const productRepo = db.getRepository(InsuranceProduct);
        const claimRepo = db.getRepository(InsuranceClaim);

        // Get member's active policies
        const policies = await policyRepo.find({
            where: { memberId: user.id },
            relations: ['product'],
            order: { createdAt: 'DESC' }
        });

        // Get available products for the member's SACCO
        const availableProducts = await productRepo.find({
            where: { tenantId: user.tenantId, status: 'active' as any }
        });

        // Get member's claims
        const claims = await claimRepo.find({
            where: { policy: { memberId: user.id } },
            relations: ['policy', 'policy.product'],
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json({
            policies,
            availableProducts,
            claims
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
