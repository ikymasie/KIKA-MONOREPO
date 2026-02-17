import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { InsurancePolicy } from '@/src/entities/InsurancePolicy';
import { getUserFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const policyId = searchParams.get('policyId');

        if (!policyId) {
            return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
        }

        const db = await getDb();
        const policyRepo = db.getRepository(InsurancePolicy);

        const policy = await policyRepo.findOne({
            where: { id: policyId, memberId: user.id },
            relations: ['product', 'member']
        });

        if (!policy) {
            return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
        }

        return NextResponse.json({
            certificateNumber: `CERT-${policy.policyNumber}`,
            issuedTo: `${policy.member?.firstName} ${policy.member?.lastName}`,
            policyName: policy.product?.name,
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
