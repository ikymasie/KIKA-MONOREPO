import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { InsuranceClaim } from '@/src/entities/InsuranceClaim';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);

        const claims = await claimRepo.find({
            where: { tenantId: user.tenantId },
            relations: ['policy', 'policy.member', 'policy.product'],
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(claims);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updateData } = body;

        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);

        const claim = await claimRepo.findOne({
            where: { id, tenantId: user.tenantId }
        });

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        Object.assign(claim, {
            ...updateData,
            reviewedBy: user.id,
            reviewedAt: new Date()
        });

        await claimRepo.save(claim);
        return NextResponse.json(claim);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
