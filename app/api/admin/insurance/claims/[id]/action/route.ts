import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server';
import { getClaim, updateClaim } from '@/src/db/services/InsuranceService';
import { sendClaimNotification } from '@/lib/notifications';
import { ClaimStatus } from '@/src/interfaces/IInsurance';

export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;
        const { action, notes, approvedAmount, rejectionReason, queryReason } = await request.json();

        const claim = await getClaim(id, user.tenantId);
        if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

        const now = new Date();
        const updates: any = {};

        switch (action) {
            case 'VERIFY':
                if (user.role !== 'member_service_rep' && user.role !== 'saccos_admin') {
                    return NextResponse.json({ error: 'Only Claims Clerks or Admins can verify' }, { status: 403 });
                }
                updates.status = ClaimStatus.IN_REVIEW;
                updates.verifiedBy = user.id;
                updates.verifiedAt = now;
                break;

            case 'QUERY':
                updates.status = ClaimStatus.QUERIED;
                updates.queryReason = queryReason || notes;
                break;

            case 'APPROVE':
                if (user.role !== 'saccos_admin') {
                    return NextResponse.json({ error: 'Only Managers can approve claims' }, { status: 403 });
                }
                updates.status = ClaimStatus.APPROVED;
                updates.adjudicatedBy = user.id;
                updates.adjudicatedAt = now;
                updates.approvedAmount = approvedAmount || claim.claimAmount;
                break;

            case 'REJECT':
                if (user.role !== 'saccos_admin') {
                    return NextResponse.json({ error: 'Only Managers can reject claims' }, { status: 403 });
                }
                updates.status = ClaimStatus.REJECTED;
                updates.adjudicatedBy = user.id;
                updates.adjudicatedAt = now;
                updates.rejectionReason = rejectionReason || notes;
                break;

            case 'DISBURSE':
                if (user.role !== 'accountant' && user.role !== 'saccos_admin') {
                    return NextResponse.json({ error: 'Only Accountants can disburse payments' }, { status: 403 });
                }
                updates.status = ClaimStatus.PAID;
                updates.disbursedBy = user.id;
                updates.disbursedAt = now;
                updates.paidAt = now;
                break;

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        if (notes) {
            updates.committeeReviewNotes = (claim.committeeReviewNotes || '') + `\n[${now.toISOString()}] ${user.role}: ${notes}`;
        }

        const updatedClaim = await updateClaim(id, user.tenantId, updates);

        // Fetch user phone to notify
        const { queryOne } = await import('@/src/db/query');
        const policyData = await queryOne('SELECT m.phone FROM insurance_policies ip INNER JOIN members m ON m.id = ip.memberId WHERE ip.id = ?', [claim.policyId]) as any;

        if (policyData && policyData.phone) {
            await sendClaimNotification(
                policyData.phone,
                updatedClaim.claimNumber!,
                updatedClaim.status!,
                updatedClaim.approvedAmount || updatedClaim.claimAmount
            );
        }

        return NextResponse.json(updatedClaim);
    } catch (error: any) {
        console.error('Error processing claim action:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
