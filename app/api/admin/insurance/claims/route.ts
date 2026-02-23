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
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const data = await listClaims(
            user.tenantId,
            undefined,
            { status },
            { page, limit }
        );

        
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching claims:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
