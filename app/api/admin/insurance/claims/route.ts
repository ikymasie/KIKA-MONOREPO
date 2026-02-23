import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listClaims } from '@/src/db/services/InsuranceService';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || (!user.isTenantAdmin() && !user.isRegulator() && !user.isGovernmentOfficer())) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || undefined;

        let claims = await listClaims(user.tenantId);

        if (status) {
            claims = claims.filter(c => c.status === status);
        }

        return NextResponse.json(claims);
    } catch (error: any) {
        console.error('Error fetching claims:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
