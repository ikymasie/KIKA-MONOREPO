import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { InsuranceClaim } = await import('@/src/entities/InsuranceClaim');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || (!user.isTenantAdmin() && !user.isRegulator() && !user.isGovernmentOfficer())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);

        const where: any = {};
        if (user.tenantId) {
            where.tenantId = user.tenantId;
        }
        if (status) {
            where.status = status;
        }

        const claims = await claimRepo.find({
            where,
            relations: ['policy', 'policy.member', 'policy.product'],
            order: { createdAt: 'DESC' }
        });

        return NextResponse.json(claims);
    } catch (error: any) {
        console.error('Error fetching claims:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
