import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Not, In } from 'typeorm';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
// Dynamic imports to avoid circular dependencies
        const { InsuranceClaim, ClaimStatus } = await import('@/src/entities/InsuranceClaim');
        const { InsurancePolicy } = await import('@/src/entities/InsurancePolicy');
        const { getUserFromRequest } = await import('@/lib/auth-server');

    
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { policyId, incidentDate, claimType, claimAmount, description, supportingDocuments } = body;

        if (!policyId || !incidentDate) {
            return NextResponse.json({ error: 'Policy ID and incident date are required' }, { status: 400 });
        }

        const db = await getDb();
        const claimRepo = db.getRepository(InsuranceClaim);
        const policyRepo = db.getRepository(InsurancePolicy);

        // 1. Fetch Policy for Triage
        const policy = await policyRepo.findOne({
            where: { id: policyId, memberId: user.id },
            relations: ['product']
        });

        if (!policy) {
            return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
        }

        const incidentDateObj = new Date(incidentDate);

        // 2. Automated Triage: Policy Status
        if (policy.status !== 'active' && policy.status !== 'waiting_period') {
            return NextResponse.json({
                error: `Claim rejected: Policy is currently ${policy.status.replace('_', ' ')}. Only active policies can file claims.`,
                triageCode: 'INVALID_POLICY_STATUS'
            }, { status: 400 });
        }

        // 3. Automated Triage: Waiting Period
        if (policy.waitingPeriodEndDate && incidentDateObj < new Date(policy.waitingPeriodEndDate)) {
            return NextResponse.json({
                error: `Claim rejected: Incident date falls within the waiting period (ends ${new Date(policy.waitingPeriodEndDate).toLocaleDateString()}).`,
                triageCode: 'WAITING_PERIOD_VIOLATION'
            }, { status: 400 });
        }

        // 4. Automated Triage: Duplicate Check
        const existingClaim = await claimRepo.findOne({
            where: {
                policyId,
                incidentDate: incidentDateObj,
                status: Not(In([ClaimStatus.REJECTED, ClaimStatus.FINAL_REJECTION]))
            }
        });

        if (existingClaim) {
            return NextResponse.json({
                error: 'A claim for this policy and incident date has already been submitted and is processing.',
                triageCode: 'DUPLICATE_CLAIM'
            }, { status: 400 });
        }

        const claimCount = await claimRepo.count();
        const claimNumber = `CLM-${new Date().getFullYear()}-${String(claimCount + 1).padStart(5, '0')}`;

        const claim = claimRepo.create({
            tenantId: user.tenantId,
            claimNumber,
            policyId,
            incidentDate: incidentDateObj,
            claimType,
            claimAmount,
            description,
            supportingDocuments,
            status: ClaimStatus.SUBMITTED
        });

        await claimRepo.save(claim);
        return NextResponse.json(claim);
    } catch (error: any) {
        console.error('Error submitting insurance claim:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
