import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { InsurancePolicy } = await import('@/src/entities/InsurancePolicy');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || !user.isTenantAdmin()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const policyRepo = db.getRepository(InsurancePolicy);

        const policies = await policyRepo.find({
            where: { product: { tenantId: user.tenantId } },
            relations: ['member', 'product'],
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(policies);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { getUserFromRequest } = await import('@/lib/auth-server');
        const { InsurancePolicy } = await import('@/src/entities/InsurancePolicy');
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'saccos_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const db = await getDb();
        const policyRepo = db.getRepository(InsurancePolicy);

        const policy = policyRepo.create({
            ...body,
            // Ensure additional defaults if needed
            status: body.status || 'waiting_period'
        });

        await policyRepo.save(policy);
        return NextResponse.json(policy);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
