import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { queryOne } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const policyId = searchParams.get('policyId');
        if (!policyId) return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });

        const policy = await queryOne(`
            SELECT ip.*, pr.name AS productName, m.firstName, m.lastName
            FROM insurance_policies ip
            INNER JOIN insurance_products pr ON pr.id = ip.productId
            INNER JOIN members m ON m.id = ip.memberId
            WHERE ip.id = ? AND ip.memberId = ? AND ip.tenantId = ?
        `, [policyId, user.id, user.tenantId]) as any;

        if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });

        return NextResponse.json({
            certificateNumber: `CERT-${policy.policyNumber}`,
            issuedTo: `${policy.firstName} ${policy.lastName}`,
            policyName: policy.productName,
            coverageAmount: policy.coverageAmount,
            startDate: policy.startDate,
            expiryDate: policy.endDate,
            status: policy.status,
            issuedAt: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Error fetching insurance certificate:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
