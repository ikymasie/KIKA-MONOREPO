import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Dynamic imports to avoid circular dependencies
        const { InsuranceClaim } = await import('@/src/entities/InsuranceClaim');
        const { getUserFromRequest } = await import('@/lib/auth-server');


        const user = await getUserFromRequest(request);
        if (!user || (!user.isTenantAdmin() && !user.isRegulator() && !user.isGovernmentOfficer())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);

        const claim = await claimRepo.findOne({
            where: { id },
            relations: ['policy', 'policy.member', 'policy.product', 'tenant']
        });

        if (!claim) {
            return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
        }

        return NextResponse.json(claim);
    } catch (error: any) {
        console.error('Error fetching claim details:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
