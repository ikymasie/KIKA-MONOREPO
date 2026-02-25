import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { listPolicies, listInsuranceProducts, listClaims, createClaim } from '@/src/db/services/InsuranceService';
import { ClaimStatus } from '@/src/interfaces/IInsurance';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [policies, availableProducts, claimsData] = await Promise.all([
            listPolicies(user.tenantId, user.id),
            listInsuranceProducts(user.tenantId, true),
            listClaims(user.tenantId, user.id)
        ]);

        return NextResponse.json({
            policies,
            availableProducts,
            claims: claimsData.claims
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

        const { queryOne } = await import("../../../../src/db/query");
        const countRes = await queryOne('SELECT COUNT(*) as c FROM insurance_claims WHERE tenantId = ?', [user.tenantId]) as any;
        const claimCount = countRes?.c || 0;
        const claimNumber = `CLM-${new Date().getFullYear()}-${String(claimCount + 1).padStart(5, '0')}`;

        const claim = await createClaim(user.tenantId, {
            ...body,
            claimNumber,
            status: ClaimStatus.SUBMITTED
        });

        return NextResponse.json(claim);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
