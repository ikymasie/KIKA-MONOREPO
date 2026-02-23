import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { createClaim } from '@/src/db/services/InsuranceService';
import { ClaimStatus } from '@/src/interfaces/IInsurance';
import { queryOne } from '@/src/db/query';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || user.role !== 'member') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { policyId, incidentDate, claimType, claimAmount, description, supportingDocuments } = await request.json();
        if (!policyId || !incidentDate) return NextResponse.json({ error: 'Policy ID and incident date are required' }, { status: 400 });

        const incidentDateObj = new Date(incidentDate);

        // 1. Fetch Policy for Triage
        const policy = await queryOne('SELECT status, waitingPeriodEndDate FROM insurance_policies WHERE id = ? AND memberId = ?', [policyId, user.id]) as any;
        if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });

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
        const existingClaim = await queryOne(`
            SELECT id FROM insurance_claims 
            WHERE policyId = ? AND incidentDate = ? AND status NOT IN ('rejected', 'final_rejection')
            LIMIT 1
        `, [policyId, incidentDateObj.toISOString().split('T')[0]]);

        if (existingClaim) {
            return NextResponse.json({
                error: 'A claim for this policy and incident date has already been submitted and is processing.',
                triageCode: 'DUPLICATE_CLAIM'
            }, { status: 400 });
        }

        const countRes = await queryOne('SELECT COUNT(*) as c FROM insurance_claims WHERE tenantId = ?', [user.tenantId]) as any;
        const claimCount = countRes?.c || 0;
        const claimNumber = `CLM-${new Date().getFullYear()}-${String(claimCount + 1).padStart(5, '0')}`;

        const claim = await createClaim(user.tenantId, {
            claimNumber,
            policyId,
            incidentDate: incidentDateObj.toISOString().split('T')[0],
            claimType,
            claimAmount,
            description,
            supportingDocuments,
            status: ClaimStatus.SUBMITTED
        });

        return NextResponse.json(claim);
    } catch (error: any) {
        console.error('Error submitting insurance claim:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
